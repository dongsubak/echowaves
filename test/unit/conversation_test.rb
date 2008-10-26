require 'test_helper'

class ConversationTest < ActiveSupport::TestCase
  context "A Conversation instance" do    
    setup do
      @conversation = Factory.create(:conversation)
    end
    
    should_require_attributes :name
    should_require_unique_attributes :name

    should_have_index :name
    should_have_index :created_at
    
    should_ensure_length_in_range :name, (8..100) 
 
    should_have_many :messages

    should "have users in conversations" do 
      @user1 = Factory.create(:user, :login => "user1")
      @user2 = Factory.create(:user, :login => "user2")
      @user3 = Factory.create(:user, :login => "user3")
      @message1 = Factory.create(:message, :conversation => @conversation, :user => @user1)
      @message2 = Factory.create(:message, :conversation => @conversation, :user => @user2)
      @message3 = Factory.create(:message, :conversation => @conversation, :user => @user1)
      @message4 = Factory.create(:message, :conversation => @conversation, :user => @user1)
      @message5 = Factory.create(:message, :conversation => @conversation, :user => @user2)
      @message6 = Factory.create(:message, :conversation => @conversation, :user => @user2)
      @message7 = Factory.create(:message, :conversation => @conversation, :user => @user3)
      @message8 = Factory.create(:message, :conversation => @conversation, :user => @user3)
      @message9 = Factory.create(:message, :conversation => @conversation, :user => @user1)
      
      assert_equal @conversation.users_in_conversation.size, 3
    end
             
  end    
end
