var WebPullToRefresh = (function () {
    'use strict';

    /**
	 * Hold all of the default parameters for the module
	 * @type {object}
	 */
    var defaults = {
        // ID of the element holding pannable content area
        contentEl: 'content',

        // ID of the element holding pull to refresh loading area
        ptrEl: 'ptr',

        //ID of ball element(container of icon)
        ballEl: 'ball',

        //ID of icon element
        iconEl: 'icon',

        // Number of pixels of panning until refresh 
        distanceToRefresh: 170,

        // Pointer to function that does the loading and returns a promise
        loadingFunction: false,

        // Dragging resistance level
        resistance: 1,

        //rotate speed
        speed: 23
    };

    var ionic = window.ionic;

    /**
	 * Hold all of the merged parameter and default module options
	 * @type {object}
	 */
    var options = {};

    /**
	 * Pan event parameters
	 * @type {object}
	 */
    var pan = {
        enabled: false,
        distance: 0,
        startingPositionY: 0,
        loading: false
    };

    /**
	 * Easy shortener for handling adding and removing body classes.
	 */
    var bodyClass ;

    /**
	 * Initialize pull to refresh, hammer, and bind pan events.
	 * 
	 * @param {object=} params - Setup parameters for pull to refresh
	 */
    var init = function (params) {
        params = params || {};
        options = {
            contentEl: document.getElementById(params.contentEl),
            ptrEl: params.ptrEl || document.getElementById(defaults.ptrEl),
            ballEl: params.ballEl || document.getElementById(defaults.ballEl),
            iconEl: params.iconEl || document.getElementById(defaults.iconEl),
            distanceToRefresh: params.distanceToRefresh || defaults.distanceToRefresh,
            loadingFunction: params.loadingFunction || defaults.loadingFunction,
            resistance: params.resistance || defaults.resistance
        };

        bodyClass = document.body.classList;
        if (!options.contentEl || !options.ptrEl) return false;
    };

    /**
	 * Determine whether pan events should apply based on scroll position on panstart
	 * 
	 * @param {object} e - Event object
	 */
    var _panStart = function (e) {
        if (pan.loading) return; //do nothing while loading...
        pan.startingPositionY = options.contentEl.scrollTop;
	    options.ballEl.style['transition-duration'] = options.ballEl.style['-webkit-transition-duration'] = '';
        options.iconEl.classList.remove('rotating');
        if (pan.startingPositionY === 0) pan.enabled = true;
    };

    /**
	 * Handle element on screen movement when the pandown events is firing.
	 * 
	 * @param {object} e - Event object
	 */
    var _panDown = function (e) {
        if (!pan.enabled) return;

        e.preventDefault();
        pan.distance = e.gesture.deltaY / options.resistance;
        _setBodyClass();
		options.ballEl.style.display = 'block';
        options.contentEl.style['overflow-y'] = 'hidden';//disble scroll while pulling..
        _setContentPan();
        _setRotate(true);
    };

    /**
	 * Handle element on screen movement when the pandown events is firing.
	 * 
	 * @param {object} e - Event object
	 */
    var _panUp = function (e) {
        if (pan.loading) return; //disable scroll while loading...
        if (!pan.enabled || pan.distance === 0) {
            options.contentEl.style['overflow-y'] = 'visible'; //enable scroll when pulling action is over...
            return;
        }

        e.preventDefault();
        pan.distance = e.gesture.deltaY / options.resistance;
        _setBodyClass();
		_setContentPan();
        _setRotate(false);
    };

    var _setRotate = function (clockWise) {
        if (clockWise) options.iconEl.style.transform = options.iconEl.style.webkitTransform = 'rotate(' + (pan.distance * defaults.speed) + 'deg)';
        else options.iconEl.style.transform = options.iconEl.style.webkitTransform = 'rotate(-' + (pan.distance * defaults.speed) + 'deg)';
    }

    /**
	 * Set the CSS transform on the content element to move it on the screen.
	 */
    var _setContentPan = function () {
        // Use transforms to smoothly animate elements on desktop and mobile devices
        options.contentEl.style.transform = options.contentEl.style.webkitTransform = 'translate3d( 0, ' + (pan.distance < -200 ? 0 : pan.distance) + 'px, 0 )';
        var ptrElDistance = (pan.distance - options.ptrEl.offsetHeight > 0) ? (pan.distance - options.ptrEl.offsetHeight) : 0;
        options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = 'translate3d( 0, ' + (ptrElDistance) + 'px, 0 )';
        var topDistance = pan.distance - options.ballEl.offsetHeight;
        //console.log('pan distance : ' + pan.distance);
        if (pan.distance > options.distanceToRefresh) topDistance = options.distanceToRefresh - options.ballEl.offsetHeight;
        //console.log('ball top distance : ' + topDistance);
        if (pan.distance != 0) options.ballEl.style.transform = options.ballEl.style.webkitTransform = 'translate3d( 0, ' + (topDistance) + 'px, 0 )';
    };

    /**
	 * Set/remove the loading body class to show or hide the loading indicator after pull down.
	 */
    var _setBodyClass = function () {
        (pan.distance > options.distanceToRefresh) ? bodyClass.add('ptr-refresh') : bodyClass.remove('ptr-refresh');
    };

    /**
	 * Determine how to animate and position elements when the panend event fires.
	 * 
	 * @param {object} e - Event object
	 */
    var _panEnd = function (e) {
        if (!pan.enabled) return;
        e.preventDefault();
		 options.contentEl.style.transform = options.contentEl.style.webkitTransform = '';
            options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = '';
            options.iconEl.style.transform = options.iconEl.style.webkitTransform = '';
            options.ballEl.style.transform = options.ballEl.style.webkitTransform = 'translate3d( 0, ' + (options.distanceToRefresh - options.ballEl.offsetHeight) + 'px, 0 )';
            var executeRefresh = bodyClass.contains('ptr-refresh');
            if (executeRefresh) {
                pan.loading = true;//means roating occur here...
                options.iconEl.classList.add('rotating');//infinite rotate here...
                options.ballEl.style['transition-duration'] = options.ballEl.style['-webkit-transition-duration'] = '1.5s';
                _doLoading();
            } else {
                options.ballEl.style.transform = options.ballEl.style.webkitTransform = 'translate3d( 0, ' + (0) + 'px, 0 )';
                options.ballEl.style.display = 'none';
                options.contentEl.style['overflow-y'] = 'visible';
            }
        _doReset(); //reset content html..
       
        pan.distance = 0;
        pan.enabled = false;
    };

    /**
	 * Position content and refresh elements to show that loading is taking place.
	 */
    var _doLoading = function () {
        // If no valid loading function exists, just reset elements
        if (!options.loadingFunction) {
            return _doReset();
        }

        // The loading function should return a promise
        options.loadingFunction(); //refresh run...
       
        // For UX continuity, make sure we show loading for at least one second before resetting
        setTimeout(function () {
            //Once actual loading is complete, reset pull to refresh
            //loadingPromise.then( _doReset );
            //_doReset();
            options.ballEl.style.transform = options.ballEl.style.webkitTransform = 'translate3d( 0, ' + (-50) + 'px, 0 )';
            setTimeout(function () {
                options.ballEl.style.display = 'none';
                pan.loading = false;
                options.contentEl.style['overflow-y'] = 'visible';
            }, 910);
        }, 1000);
    };

    /**
	 * Reset all elements to their starting positions before any paning took place.
	 */
    var _doReset = function () {
        bodyClass.remove('ptr-loading');
        bodyClass.remove('ptr-refresh');
        bodyClass.add('ptr-reset');

        var bodyClassRemove = function () {
            bodyClass.remove('ptr-reset');
            document.body.removeEventListener('transitionend', bodyClassRemove, false);
        };

        document.body.addEventListener('transitionend', bodyClassRemove, false);
    };

    return {
        init: init,
        panStart: _panStart,
        panDown: _panDown,
        panUp: _panUp,
        panEnd: _panEnd
    }
})();