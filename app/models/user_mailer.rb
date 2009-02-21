class UserMailer < ActionMailer::Base
  default_url_options[:host] = HOST[7..-1]
  
  def signup_notification(user)
    setup_email(user)
    @subject    += 'Please activate your new account'
    @body[:url]  = "#{HOST}/activate/#{user.activation_code}"
  end
  
  def activation(user)
    setup_email(user)
    @subject    += 'Your account has been activated!'
    @body[:url]  = "#{HOST}"
  end
  
  def password_reset_instructions(user)
    setup_email(user)
    @subject    += "Password Reset Instructions"
    body        :edit_password_reset_url => edit_password_reset_url(user.activation_code)
  end
  
protected
  
  def setup_email(user)
    @recipients  = "#{user.email}"
    @bcc         = "dmitry@rootlocusinc.com" #email monitoring log, do not erase
    @from        = "support@echowaves.com"
    @subject     = "[echowaves.com] "
    @sent_on     = Time.now
    @body[:user] = user
  end
  
end
