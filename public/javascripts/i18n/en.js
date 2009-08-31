// I18n is slightly modified version of babilu.js from Tore Darell

var I18n = I18n || (function() {
    // Replace {{foo}} with obj.foo
    function interpolate(string, object) {
        return string.replace(/\{\{([^}]+)\}\}/g, function() {
            return object[arguments[1]] || arguments[0];
        });
    };

    // Split "foo.bar" to ["foo", "bar"] if key is a string
    function keyToArray(key) {
        if(!key) {
            return [];
        }
        if(typeof key != "string") {
            return key;
        }
        return key.split('.');
    };

    // Looks up a translation using an array of strings where the last
    // is the key and any string before that define the scope. The
    // current locale is always prepended and does not need to be
    // provided. The second parameter is an array of strings used as
    // defaults if the key can not be found. If a key starts with ":"
    // it is used as a key for lookup.  This method does not perform
    // pluralization or interpolation.
    function lookup(keys, defaults) {
        var i = 0, value = I18n.translations;
        defaults = (typeof defaults === "string") ? [defaults] : (defaults || []);
        while(keys[i]) {
            value = value && value[keys[i]];
            i++;
        }
        if(value) {
            return value;
        } else {
            if(defaults.length === 0) {
                return null;
            } else if (defaults[0].substr(0,1) === ':') {
                return lookup(keys.slice(0, keys.length - 1).concat(keyToArray(defaults[0].substr(1))), defaults.slice(1));
            } else {
                return defaults[0];
            }
        }
    };

    // Returns other when 0 given
    function pluralize(value, count) {
        if(count === undefined) return value;
        return count === 1 ? value.one : value.other;
    };

    // Works mostly the same as the Ruby equivalent, except there are
    // no symbols in JavaScript, so keys are always strings. The only
    // time this makes a difference is when differentiating between
    // keys and values in the defaultValue option. Strings starting
    // with ":" will be considered to be keys and used for lookup,
    // while other strings are returned as-is.
    function translate(key, options) {
        if(typeof key != "string") {
            // Bulk lookup
            var a = [], i;
            for(i = 0; i < key.length; i++) {
                a.push(translate(key[i], options));
            }
            return a;
        } else {
            options = options || {};
            options.defaultValue = options.defaultValue || null;
            key = keyToArray(options.scope).concat(keyToArray(key));
            var value = lookup(key, options.defaultValue);
            if(typeof value !== "string" && value) {
                value = pluralize(value, options.count);
            }
            if(typeof value === "string") {
                value = interpolate(value, options);
            }
            return value;
        }
    }

    return {
        translate: translate,
        t: translate
    };
})();

I18n.translations = I18n.translations || {"footer":{"terms_and_conditions":"Terms&Conditions","uptime_monitoring":"Website Uptime Monitoring By","conversations":"convos","report_problems_or_abuse":"Report problems or Abuse to"},"time":{"formats":{"short":"%d %b %H:%M","long":"%B %d, %Y %H:%M","default":"%a, %d %b %Y %H:%M:%S %z"},"pm":"pm","am":"am"},"home":{"index":{"headline2":"The source code is hosted at: <a href=\"http://github.com/dmitryame/echowaves\">http://github.com/dmitryame/echowaves</a>.","p3":"Take it for a spin, post messages to our ","p1":"<h5>If you like to chat, or blog, or post pictures, or share updates with friends, or just socialize -- you will enjoy EchoWaves.</h5> If you have any ideas or suggestions feel free to talk about it in","feedback_advice":"If you find an issue or would like to make a suggestion on what functionality you would like to see in echowaves, you can do it at <a href=\"http://code.google.com/p/echowaves/issues/list\">http://echowaves.googlecode.com/</a>","p2":"-- it's free and anyone can join. Start your own convos, invite all your friends to join your convos, follow other convos that look interesting to you. Have fun!","headline1":"EchoWaves.com is an opensource Social Group Chat."}},"date":{"formats":{"short":"%b %d","long":"%B %d, %Y","default":"%Y-%m-%d"},"abbr_month_names":[null,"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],"day_names":["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"month_names":[null,"January","February","March","April","May","June","July","August","September","October","November","December"],"order":["year","month","day"],"abbr_day_names":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]},"errors":{"only_the_owner_can_invite":"Only the owner of this conversation can invite other users","sorry_this_is_a_private_convo":"Sorry, this is a private conversation. You can try anoter one"},"notices":{"you_must_be_logged_in":"You must be logged in to access this page","you_must_be_logged_out":"You must be logged out to access this page"},"number":{"percentage":{"format":{"delimiter":""}},"currency":{"format":{"separator":".","precision":2,"format":"%u%n","delimiter":",","unit":"$"}},"precision":{"format":{"delimiter":""}},"format":{"separator":".","precision":3,"delimiter":","},"human":{"format":{"precision":1,"delimiter":""},"storage_units":{"units":{"byte":{"one":"Byte","other":"Bytes"},"tb":"TB","kb":"KB","mb":"MB","gb":"GB"},"format":"%n %u"}}},"activerecord":{"errors":{"template":{"body":"There were problems with the following fields:","header":{"one":"1 error prohibited this {{model}} from being saved","other":"{{count}} errors prohibited this {{model}} from being saved"}},"messages":{"inclusion":"is not included in the list","equal_to":"must be equal to {{count}}","less_than":"must be less than {{count}}","accepted":"must be accepted","empty":"can't be empty","wrong_length":"is the wrong length (should be {{count}} characters)","exclusion":"is reserved","invalid":"is invalid","less_than_or_equal_to":"must be less than or equal to {{count}}","not_a_number":"is not a number","taken":"has already been taken","too_short":"is too short (minimum is {{count}} characters)","odd":"must be odd","greater_than":"must be greater than {{count}}","too_long":"is too long (maximum is {{count}} characters)","confirmation":"doesn't match confirmation","blank":"can't be blank","even":"must be even","greater_than_or_equal_to":"must be greater than or equal to {{count}}"}}},"support":{"array":{"words_connector":", ","two_words_connector":" and ","last_word_connector":", and "}},"messages":{"new_messages":"new messages","original_message":"original message"},"conversations":{"not_allowed_to_write_warning":"You are not allowed to add messages to this conversation.","recently_started_conversations":"recently started convos","login_or_register_to_participate":"Please <a href=\"/login\">login</a> to participate.<br/>Don't have an account yet? <a href=\"/signup\">signup now</a>, it's free","go_to_conversation":"go to conversation","convo_sucesfully_created":"Conversation was successfully created.","new_conversation":"new convo","bookmarked_conversations":"bookmarked conversations","this_is_an_read_only_convo":"This is a read only conversation","new_spawned_conversation":"new spawned convo","user_spawned_convo_description":"{{login}} spawned this convo, following the message {{original_message_link}}\n\nPlease provide a description and an appropriate title for this new conversation","look_for_conversations":"look for convos","start_new_conversation":"start new convo","already_spawned_warning":"You already spawned a new conversation from this message."},"ie6update":{"url":"http://www.microsoft.com/windows/internet-explorer/default.aspx","msg":"Internet Explorer is missing updates required to view this site. Click here to update... "},"users":{"since":"since:","n_followers":"{{number}} followers","look_for_users":"look for users","signup_complete":"Signup complete! Please login to continue.","since_date":"since: {{date}}","invite_all_followers":"Invite all my followers","about":"About you","n_convos_started":"{{number}} convos started","profile_updated":"Profile updated correctly","n_messages_posted":"{{number}} messages posted","logged_out":"You have been logged out.","email_invites":"Email invites","following_n_users":"following {{number}} users","logged_in_sucesfully":"Logged in successfully","could_not_login_as":"Couldn't log you in as {{login}}","recently_joined_users":"recently joined users","invite_followed_users":"Invite followed users","invite_users":"Invite users","sign_up_as_new_user":"sign up as new user"},"ui":{"recently_visited":"Recently visited","following":"Following","recent_convos":"Recent convos","forgot_password":"forgot password?","popular_convos":"Popular convos","transport_closed":"transport closed","password_confirmation":"confirm password","total_convos":"Total convos","read_only":"read only","view_all":"view all","this_is_the_newest_message":"This is the newest message","tags":"tags","cancel":"cancel","all":"all","name":"name","home":"home","get_an_gravatar_here":"get a gravatar here","back":"back","update_your_profile":"Update your profile","create":"create","recent_followers":"Recent followers","attach_file":"attach file","email":"email","search_advice":"write something and click search!","followed_convos":"Followed Convos","make_private":"make private","system_messages":"system messages","spawn":"spawn","password":"password","thanks_for_signup":"Thanks for signing up! We're sending you an email with your activation code.","sound_off":"sound off","update":"update","convos":"Convos","tagged_with":"Tagged with","total_users":"Total users","reportconfirm_conversation":"Are you sure you would like to report this convo? The abuser will be punished.","invite":"invite","login_name":"login name","search_messages":"search messages","my_conversations":"My convos","view_all_or_add_a_tag":"<a href=\"#tags\">view all</a> or <a href=\"#tags\">add a tag</a>","click_to_activate":"Click here to activate your account","follow":"follow","view_all_convos":"view all convos","with_files":"with files","reportconfirm":"Are you sure you would like to report this message? The abuser will be punished.","time_zone":"time zone","conversations":"convos","more_messages":"more messages","unfollow":"unfollow","code":"code","receive_email_notifications":"Receive email notifications","logout":"logout","recent_tags":"Recent tags","started_by":"started by","signup":"SignUp","users_conversations":"Users convos","shift_enter":"(shift+Enter to insert new line)","messages":"Messages","total_messages":"Total messages","spawnconfirm":"Are you sure you want to spawn a new convo off of this message?","search_conversations":"search convos","email_confirmation":"confirm email","edit_profile":"edit profile","its_free":"it's free and anyone can join","with_images":"with images","send":"send","news":"New Messages","attach":"Attach","connected":"connected","report":"report","test_conversation":"TEST convo","add_tag":"add tag","view_all_users":"view all users","followers":"Followers","make_writable":"make writable","transport_opened":"transport opened","search":"search","echowaves_conversation":"EcHoWaVeS.CoM convo","make_public":"make public","sound_on":"sound on","login":"login","recently_joined":"Recently joined","users":"users","signup_error":"We couldn't set up that account, sorry. Please try again, or contact an admin (link is above).","private_convo":"Private conversation","confirm_remove_tag":"Are you sure you want to untag?","back_to_parent":"back to parent","followed_users":"Followed Users","last_message":"last message","make_read_only":"set as read only","description":"description"},"datetime":{"distance_in_words":{"about_x_months":{"one":"about 1 month","other":"about {{count}} months"},"x_minutes":{"one":"1 minute","other":"{{count}} minutes"},"x_months":{"one":"1 month","other":"{{count}} months"},"less_than_x_seconds":{"one":"less than 1 second","other":"less than {{count}} seconds"},"about_x_years":{"one":"about 1 year","other":"about {{count}} years"},"half_a_minute":"half a minute","over_x_years":{"one":"over 1 year","other":"over {{count}} years"},"about_x_hours":{"one":"about 1 hour","other":"about {{count}} hours"},"x_seconds":{"one":"1 second","other":"{{count}} seconds"},"x_days":{"one":"1 day","other":"{{count}} days"},"less_than_x_minutes":{"one":"less than a minute","other":"less than {{count}} minutes"}},"prompts":{"day":"Day","second":"Seconds","month":"Month","year":"Year","minute":"Minute","hour":"Hour"}}};
