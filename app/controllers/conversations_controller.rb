class ConversationsController < ApplicationController
  
  public :render_to_string # this is needed to make render_to_string public for message model to be able to use it
  before_filter :require_user, :except => [:index, :show, :auto_complete_for_conversation_name, :complete_name ]
  before_filter :find_conversation, :only => [:show, :follow, :follow_with_token, :unfollow, :readwrite_status, :private_status, :report, :invite, :invite_from_list, :add_tag, :remove_tag]
  before_filter :check_read_access, :only => [:show]
  after_filter :store_location, :only => [:index, :new]  
  
  auto_complete_with_scope_for 'published', :conversation, :name # multiple scopes can be chained like 'published.readonly'

  auto_complete_for :tag, :name

  def complete_name
    @conversation = Conversation.published.find_by_name(params[:id])
    redirect_to conversation_path(@conversation)
  end

  def index
    if params[:tag] != nil
      @conversations = Conversation.tagged_with(params[:tag], :on => :tags).published.paginate :page => params[:page], :order => 'created_at DESC'
    else
      @conversations = Conversation.published.not_personal.paginate :page => params[:page], :order => 'created_at DESC'
    end

    respond_to do |format|
      format.html
      format.atom
      format.xml { render :xml => @conversations }
    end
  end

  def show
    @messages = @conversation.messages.published.find(:all, :include => [:user], :limit => 100, :order => 'id DESC').reverse
    current_user.conversation_visit_update(@conversation) if logged_in?

    @has_more_messages = @conversation.has_messages_before?(@messages.first)

    respond_to do |format|
      format.html { render :layout => 'messages' }
      format.xml  { render :xml => @conversation }
    end
  end

  def new
    @conversation = Conversation.new
    respond_to do |format|
      format.html
      format.xml  { render :xml => @conversation }
    end
  end

  def spawn
    @conversation = Conversation.new
    if params[:message_id]
      @message = Message.find(params[:message_id])

      if current_user.conversations.find_by_parent_message_id( @message.id )
        flash[:error] = t("conversations.already_spawned_warning")
        redirect_to conversation_path(@message.conversation_id)
        return
      end

      @conversation.parent_message_id = @message.id
      @conversation.description = %Q(
#{ t( "conversations.user_spawned_convo_description", :login => current_user.login, :original_message_link => conversation_message_url(@message.conversation_id, @message) ) }
      )
    end
    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @conversation }
    end
  end
  
  def create
    @conversation = Conversation.new(params[:conversation])
    
    respond_to do |format|
      if current_user.conversations << @conversation
        flash[:notice] = t("conversations.convo_sucesfully_created")
        
        if @conversation.spawned?
          # create a message in the original conversation notifying about this spawning
          # and send realtime notification to everyone who's listening
          notification_message = @conversation.notify_of_new_spawn( current_user )
          notification_message.send_stomp_message(self) unless notification_message == nil
          # copy the original message in the recient create convo
          @copied_message = @conversation.parent_message.clone
          @copied_message.conversation = @conversation
          @copied_message.save
        else
          # create a first message that is the same as the convo description
          message = current_user.messages.create( :conversation => @conversation, :message => @conversation.description)
          message.save
        end
        
        # now let's create a system message and send it to the the creator's followers
        current_user.friends_convos.each do |personal_convo|
          next  if (@conversation && @conversation.parent_message && personal_convo == @conversation.parent_message.conversation)
          # TODO: how to translate this for the current user?
          msg = " created a new convo: <a href='/conversations/#{@conversation.id}'>#{@conversation.name}</a>"
          notification = current_user.messages.create( :conversation => personal_convo, :message => msg)
          notification.system_message = true
          notification.save
          notification.send_stomp_message(self)
        end
        
        format.html { redirect_to(@conversation) }
        format.xml  { render :xml => @conversation, :status => :created, :location => @conversation }
      else
        format.html do
          if @conversation.parent_message_id.blank?
            render( :action => "new" )
          else
            @message = @conversation.parent_message
            render( :action => "spawn" )
          end
        end
        format.xml  { render :xml => @conversation.errors, :status => :unprocessable_entity }
      end
    end
  end

  def follow
    current_user.follow(@conversation)
  end
  
  def follow_with_token
    current_user.follow(@conversation, params[:token])
    redirect_to @conversation
  end
  
  def unfollow
    current_user.unfollow(@conversation)
  end

  def follow_from_list
    follow
  end
  
  def unfollow_from_list
    unfollow
  end

  def readwrite_status
    read_only = (params[:mode] == 'rw') ? false : true 
    @conversation.update_attributes( :read_only => read_only ) if ( @conversation.owner == current_user )
    redirect_to conversation_path( @conversation )
  end

  def private_status
    private_status = (params[:mode] == 'public') ? false : true 
    @conversation.update_attributes( :private => private_status ) if ( @conversation.owner == current_user )
    redirect_to conversation_path( @conversation )
  end
  
  def report
    @conversation.report_abuse(current_user)
    # FIXME: refactor this or simplify if do not need to degrade if there is no javascript
    # what to do with the other users currently in this conversation if is disabled?
    if @conversation.disabled_by_abuse_report?
      if request.xhr?
        render :update do |page|
          page.redirect_to(conversations_path)
        end
      else
        redirect_to conversations_path
      end
    else
      render(:nothing => true)
    end
  end
  
  def invite
    @friends = current_user.friends    
    # should also remove the users if they were already invited
    @friends.delete_if do |user|
      invite_for_user = Invite.find(:first, :conditions => ["user_id = ? and conversation_id = ?", user.id, @conversation.id ] )
      true unless invite_for_user == nil
    end
    # should also remove the users that already follow proposed convo
    # @friends.delete_if do |user|
    #   user.conversations.detect {|convo| convo.id == @conversation.id}
    # end
    render :layout => "invite"
  end
  
  def invite_from_list
    current_user.friends.each do |user| 
      @user = user if(user.id.to_s == params[:user_id]) #search for the user in friends collection
    end
    # TODO this whole thing preferebly should move into the model
    existing_invite = Invite.find(:first, :conditions => ["user_id = ? and requestor_id = ? and conversation_id = ?", @user.id, current_user.id, params[:id] ] )
    return if(existing_invite != nil)#don't do anything, already invited
    @invite = Invite.new
    @invite.user_id = @user.id
    @invite.requestor = current_user
    @invite.conversation_id = params[:id]
    @invite.save
    
    if @conversation.private
      @user.deliver_private_invite_instructions!(params[:id])
      # flash[:error] = "<a href=\"#{HOST}/conversations/#{params[:id]}/follow_with_token?token=#{@user.activation_code}\">Click here to reset your password</a>" #want this notice it red, that's why it's error
      flash[:error] =  follow_with_token_conversation_url(params[:id], :token => @user.activation_code)
    else
      # now let's create a system message and send it to the convo channel
      # TODO: how to translate this for the current user?
      msg = " invites you to follow a convo: <a href='/conversations/#{params[:id]}'>#{@invite.conversation.name}</a>"
      notification = current_user.messages.create( :conversation => @user.personal_conversation, :message => msg)
      notification.system_message = true
      
      notification.save
      notification.send_stomp_message(self)
    end
    
    render :update do |page| 
      page["user_" + @user.id.to_s].visual_effect :drop_out
    end 
  end

  def add_tag
    current_user.tag(@conversation, :with => @conversation.tags.collect{|tag| tag.name}.join(", ")  + ", " + params[:tag][:name].to_s, :on => :tags)
  end
  
  def remove_tag
    @conversation.tag_list.remove(params[:tag])
    @conversation.save    
  end

private

  def find_conversation
    @conversation = Conversation.published.find( params[:id] )
  end
  
  def check_read_access
    unless @conversation.readable_by?(current_user) || !@conversation.private
      flash[:error] = "Sorry, this is a private conversation. You can try anoter one"
      redirect_to conversations_path
      return
    end
  end

end