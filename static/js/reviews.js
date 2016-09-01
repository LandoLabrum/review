jQuery(function($) {
    // Manual Variables for Review Animation
    var start_val = 0; // Starting value (should be kept at '1')
    var max_steps = 30; // Maximum number of steps (should be calculated, the higher the number the steps the slower the animation)
    var duration = 500; // How long should the swipe take (total animation will be twice as long)
    var arcAngle = 0; // Enter the start degree
    var arcEnd = 360; // Enter the end degree
    var arcAngleDelay = 30;  // This should be 30 so it matches the standard framerate
    var exp_duration = duration*1.5;
    var vw = $(window).width();  // Set the circle radius here (in this case it is 100% of the viewport width, our final circle will be 200% of the viewport width)
    var arcAngleBy = arcEnd/max_steps; // Calculates the degree steps
    var viewport_width = $(window).width()*2;
    var timing = duration/max_steps;
    var num_recommends = 0;
    var curr_social_network = 0;
    var yelp_android_url = "";

    // Creates the vector paths
    function createVectorPath(elem, angle, radius, last) {
	var radius = radius*2;
	var endAngleDeg = angle - 90;
	var endAngleRad = (endAngleDeg * Math.PI) / 180;
	var largeArcFlag = (angle < 180 ? '0' : '1');
	var endX = Math.cos(endAngleRad) * radius;
	var endY = radius + (Math.sin(endAngleRad) * radius);
	var diameter = radius*2;
	if(last == 0){
	    var data = 'M'+radius+','+radius+' v-'+radius+' a'+radius+','+radius+' 0 ' + largeArcFlag + ',1 ' + endX + ',' + endY + ' z';
	}else{
	    var data = 'M'+radius+', '+radius+'m -'+radius+', 0 a '+radius+','+radius+' 0 1,0 '+diameter+',0 a '+radius+','+radius+' 0 1,0 -'+diameter+',0';
	}
	$('#'+elem).find('path').attr('d',data);
    }

    function circleSwipeLoop(inner_id,inc,max,timing){
	setTimeout(function(){
	    if(inc <= max){
		arcAngle += arcAngleBy;
		var threshhold = arcEnd-arcAngleBy;
		if (arcAngle <= threshhold) {
		    var endAngle = 0;
		}else{
		    var endAngle = 1;
		}
		if(inc % 2){
		    createVectorPath('svgPath2',arcAngle,vw,endAngle);
		    $(inner_id).attr('class', 'svgPath1');
		}else{
		    createVectorPath('svgPath1',arcAngle,vw,endAngle);
		    $(inner_id).attr('class', 'svgPath2');
		}
		inc++;
		circleSwipeLoop(inner_id,inc,max,timing);
	    }
	}, timing);
    }

    function isAndroid() {
	return navigator.userAgent.match(/Android/i);
    }
    function isBlackBerry() {
	return navigator.userAgent.match(/BlackBerry/i);
    }
    function isIOS() {
	return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    }
    function isOpera() {
	return navigator.userAgent.match(/Opera Mini/i);
    }
    function isFirefox() {
	return navigator.userAgent.match(/Firefox/i);
    }
    function isWindows() {
	return navigator.userAgent.match(/IEMobile/i);
    }
    function iosVersion() {
	if (/iP(hone|od|ad)/.test(navigator.platform)) {
	    // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
	    var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
	    return parseInt(v[1], 10) || 9;
	}
	return 9;
    }
    function prepare_google_url() {
	// prepare google url
	// regex replace /maps/place format URL to work on iOS
	if (googleMapsUrl.length >= 1) {
	    var re = /.*\/maps\/place\/(.*?)\/@(.*?),(.*?),.*0x(.*?):(.*?)\!/;
	    var str = googleMapsUrl;
	    var m;

	    if ((m = re.exec(str)) !== null) {
		if (m.index === re.lastIndex) {
		    re.lastIndex++;
		}
		googleMapsUrl = 'https://www.google.com/maps/?q='+m[1]+'&center='+m[2]+','+m[3]+'&ftid=0x'+m[4]+':0x'+m[5]+'&hl=en-US&gl=us';
	    } else {
		googleMapsUrl = googleMapsUrl.replace("/search", "/maps");
	    }

	    googleMapsUrl = "comgooglemaps://?mapsurl=" + encodeURIComponent(googleMapsUrl);
	}
    }
    function reset_company_to_lowercase()
    {
	// Hacktastic way to reset value of Company Name if entered in All Caps.
	var companyName = $('.main-review-content h3 span');
	var lowerCaseCompanyName = companyName.text().toLowerCase();
	// Reset to reformatted version of Company Name in HTML, then Capitilize using CSS
	companyName.text(lowerCaseCompanyName);
    }
    function showStarsReview() {
	$('#homemade_rating').fadeIn();
	$('#starsRating').raty({
	    path: '/static/img',
	    targetType : 'score',
	    targetKeep : true,
	    score: 5,
	    click: function(score, evt) {
		$('#star-rating').val(score);
	    }
	});
    };
    function showLoading() {
	// show loading animation
	$('#will_rate_us').fadeOut('fast', function() {
	    if (iosVersion() < 9) {
		$('.review-step-try-social.detector').fadeIn();
	    }
	});
    };
    function trySocial(socialUrl) {
	if (socialUrl !== null) {
	    var decoded = $('<div/>').html(socialUrl).text();
	    window.location = decoded;
	}
    }

    function fade_in_next_review_media(index) {
	if(socialMediaOrder[index] == "google")
	    $('#select-google').fadeIn();
	else if(socialMediaOrder[index] == "facebook")
	    $('#select-facebook').fadeIn();
	else if(socialMediaOrder[index] == "yelp")
	    $('#select-yelp').fadeIn();
	    else if(socialMediaOrder[index] == "homemade_rating")
	    $('#select-homemade_rating').fadeIn();
    }

    function go_to_next_review_media(last_screen, index) {
	$(last_screen).fadeOut(function() {
	    switch(index) {
	    case 0:
	    case 1:
	    case 2:
		fade_in_next_review_media(index);
		break;
	    case 3:
		if (num_recommends > 0 ) {
		    $('#thanks_for_visiting_block').fadeIn()
		}else{
		    showStarsReview();
		}
		break;
	    }
	});
    }

    //EVENTS
    $("#review-successful-no").click(function() {
	curr_social_network++;
	go_to_next_review_media("#did_it_work_block", curr_social_network);
    });
    $("#review-successful-yes").click(function() {
	curr_social_network++;
	num_recommends++;
	go_to_next_review_media("#did_it_work_block", curr_social_network);
    });

    // tries to execute the uri:scheme
    function uriSchemeWithHyperlinkFallback(uri, href) {
	setTimeout(function() { window.location=href; }, 25);
	window.location = uri;
    }

    function run_animation(inner_id, id, url, fadeout_id, evt) {
	$(id).fadeIn(function(){
	    var viewport_width = $(window).width()*4;
	    var viewport_height = $(window).height()*4;
	    var viewport_half = viewport_width/2;
	    arcAngle=0;
	    // Expand the animation holder
	    $(id).find('.ani_expand').animate({
		'width':viewport_width,
		'height':viewport_width,
		'margin-left':'-150%',
		'margin-top':'-'+viewport_half,
	    },{duration:exp_duration, queue:false});
	    circleSwipeLoop(inner_id,start_val,max_steps,timing); // Invokes the function and forces it to loop on itself
	    evt.preventDefault();
	}).delay(3000).hide(function(){
	    $('#did_it_work_block').delay(2000).fadeIn();
	    trySocial(url);
	});
	$(fadeout_id).delay(1500).fadeOut();
    }

    function run_google_animation(evt){
	if(googleReviewUrl == "")
	    run_animation("#ani_swipe_google", "#google-anim", googleMapsUrl, "#select-google", evt);
	else
	    run_animation("#ani_swipe_google", "#google-anim", googleReviewUrl, "#select-google", evt);
    }
    function run_facebook_animation(evt){
	run_animation("#ani_swipe_facebook", "#facebook-anim", facebookUrl, "#facebook-tip", evt);
    }
    function run_yelp_animation(evt){
	run_animation("#ani_swipe_yelp", "#yelp-anim", yelpUrl, "#select-yelp", evt);
    }

    $('#google-recommend-yes').click(run_google_animation);
    $('#facebook-recommend-yes').click(function(evt) {
	if( isAndroid() ) {
	    evt.preventDefault();
	    uriSchemeWithHyperlinkFallback($(this).data('scheme'), $(this).attr('href'));
	    $("#select-facebook").fadeOut(function () {
		$('#did_it_work_block').fadeIn();
	    });
	}else if( isIOS() ) {
	    $("#select-facebook").fadeOut(function() {
		$("#facebook-tip").fadeIn();
	    });
	}else {
	    $("#select-facebook").fadeOut(function() {
		$("#facebook-tip").fadeIn();
	    });
	}
    });
    $('#facebook-tip-ok').click(run_facebook_animation);
    $('#yelp-recommend-yes').click(function(evt) {
	if( isAndroid() ) {
	    evt.preventDefault();
	    uriSchemeWithHyperlinkFallback($(this).data('scheme'), $(this).attr('href'));
	    $('#select-yelp').delay(1000).fadeOut(function() {
		$('#did_it_work_block').delay(3000).fadeIn();
	    });
	}else{
	    run_yelp_animation(evt);
	}
    });

    $("#main-recommend-yes").click(function(evt) {
	go_to_next_review_media("#will_rate_us", 0);
    });

    $("#main-recommend-no").click(function() {
	$("#will_rate_us").fadeOut(function() {
	    $('#bad_feedback').fadeIn();
	});
    });

    $("#google-recommend-no").click(function() {
    	curr_social_network++;
	go_to_next_review_media("#select-google", curr_social_network);
    });

    $("#facebook-recommend-no").click(function() {
    	curr_social_network++;
	go_to_next_review_media("#select-facebook", curr_social_network);
    });

    $("#yelp-recommend-no").click(function() {
    	curr_social_network++;
	go_to_next_review_media("#select-yelp", curr_social_network);
    });

    //MAIN
    if (socialMediaOrder.length <= 1) {
	socialMediaOrder = 'google,facebook,yelp,homemade_rating';
    }

    socialMediaOrder = socialMediaOrder.replace(' ', '').split(",");

    reset_company_to_lowercase();
    prepare_google_url();

    $('#will_rate_us').fadeIn('medium');
    if( isAndroid() ) {
	$('#facebook-recommend-yes').attr('data-scheme', "fb://facewebmodal/f?href=" + facebookUrlLong);
	$('#facebook-recommend-yes').attr('href', facebookUrlLong);

	yelp_android_url="http://www.yelp.com/biz/" + yelpUrl.split("=")[1];
	$('#yelp-recommend-yes').attr('data-scheme', yelp_android_url);
	$('#yelp-recommend-yes').attr('href', yelp_android_url);
    }
});
