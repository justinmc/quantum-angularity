(function (window, $, angular) {
    'use strict';

    /**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    * Document Ready -
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    $(document).ready(function() {

    });

    /**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    * Angular App
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    var App = angular.module('Hexangular', []);

    App.config(['$locationProvider', '$interpolateProvider', function($location, $interpolateProvider) {
        // $location.html5Mode(true);

        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
    }]);


})(this, jQuery, angular);
;/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Hexangular Controller -
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var HexangularController = function($rootScope, $scope, $http, $routeParams) {

    // constants

    // scope data
    // app state
    $scope.state = {

    };

    $scope.smallImages = [
        {
            url: 'http://placekitten.com/500/800'
        },
        {
            url: 'http://placekitten.com/505/490'
        },
        {
            url: 'http://placekitten.com/510/820'
        },
        {
            url: 'http://placekitten.com/520/480'
        },
        {
            url: 'http://placekitten.com/530/490'
        },
        {
            url: 'http://placekitten.com/540/500'
        }
    ];

    $scope.mediumImages = [
        {
            url: 'http://placekitten.com/900/800'
        },
        {
            url: 'http://placekitten.com/1000/700'
        },
        {
            url: 'http://placekitten.com/1100/600'
        },
        {
            url: 'http://placekitten.com/1300/800'
        },
        {
            url: 'http://placekitten.com/600/1700'
        },
        {
            url: 'http://placekitten.com/900/900'
        }
    ];

    $scope.largeImages = [
        {
            url: 'http://placekitten.com/1300/900'
        },
        {
            url: 'http://placekitten.com/1250/800'
        },
        {
            url: 'http://placekitten.com/900/600'
        },
        {
            url: 'http://placekitten.com/1440/900'
        },
        {
            url: 'http://placekitten.com/800/1800'
        },
        {
            url: 'http://placekitten.com/1200/1200'
        }
    ];


    $scope.thumbnailImages = [
        {
            url: 'http://placekitten.com/250/150'
        },
        {
            url: 'http://placekitten.com/255/150'
        },
        {
            url: 'http://placekitten.com/260/150'
        },
        {
            url: 'http://placekitten.com/270/150'
        },
        {
            url: 'http://placekitten.com/280/150'
        },
        {
            url: 'http://placekitten.com/290/150'
        }
    ];

    initialize();

    /* getItems -
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    function initialize() {

        // add safeApply to rootScope
        $rootScope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        createEventHandlers();
    }

    /* createEventHandlers -
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    function createEventHandlers() {

    }

};


var App = angular.module('Hexangular');
App.controller('HexangularController', HexangularController);

HexangularController.$inject = ['$rootScope', '$scope', '$http', '$routeParams'];
;var App = angular.module('Hexangular');

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Content Gallery Directive -
* Requires Modernizr detect: cssanimations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
App.directive('contentGallery', ['$rootScope', '$timeout', '$q', function($rootScope, $timeout, $q) {

    return {
        restrict: 'A',
        template: '<div class="content-gallery" ng-class="{fullscreen: state.fullscreen, embedded: !state.fullscreen, transitions: state.transitions}"><!-- gallery interface --><div class="gallery-interface" ng-style="galleryInterfaceStyle"><!-- zoom --><div class="zoom-button only-icon icon-zoom-out" ng-show="state.fullscreen" ng-tap="disableFullscreen()"></div><div class="zoom-button only-icon icon-zoom-in" ng-show="!state.fullscreen" ng-tap="enableFullscreen()"></div><!-- next slide --><div class="activation-area next" ng-tap="nextSlide()" ng-hide="state.slideCount - 1 == state.currentSlideIndex"><div class="navigation-button next only-icon icon-chevron-right"></div></div><!-- previous slide --><div class="activation-area previous" ng-tap="previousSlide()" ng-hide="state.currentSlideIndex == 0"><div class="navigation-button previous only-icon icon-chevron-left"></div></div><!-- scroll up --><div class="activation-area up" ng-mousedown="scrollUp()" ng-hide="imageList[state.currentSlideIndex].atTop || !isImageTallerThanWindow() || !state.fullscreen"><div class="scroll-button up only-icon icon-chevron-up"></div></div><!-- scroll down --><div class="activation-area down" ng-mousedown="scrollDown()" ng-hide="imageList[state.currentSlideIndex].atBottom || !isImageTallerThanWindow() || !state.fullscreen"><div class="scroll-button down only-icon icon-chevron-down"></div></div></div><div class="gallery-container" ng-style="galleryContainerStyle" ng-class="{active: state.slideActive}"><!-- slide container --><div class="slide-container" ng-style="slideContainerStyle"><div class="slide slide-[[ key ]]" ng-style="slideStyle" ng-class="{active: key == state.currentSlideIndex}" ng-repeat="(key, image) in imageList"><img class="image-content" ng-src="[[ image.url ]]"></div></div></div><!-- directive: thumbnail-gallery --><div thumbnail-gallery thumbnail-list="thumbnailImageList" width="thumbnailWidth" spacing="4" fullscreen="state.fullscreen"></div></div>',
        replace: false,
        scope: {
            smallImageList: '=',
            mediumImageList: '=',
            largeImageList: '=',
            thumbnailImageList: '=',

            thumbnailWidth: '@',
            thumbnailHeight: '@',

            smallWidth: '@',
            mediumWidth: '@',
            largeWidth: '@'
        },

        link: function($scope, $element, $attrs) {

            // contants
            var DEBOUNCE_TIME = 350,                // time to delay keydown fire event
                SCROLL_MARGIN = 15,                 // margin below height overflow images
                SWIPE_VELOCITY = 0.4,               // swipe left/right activation velocity
                DRAG_DISTANCE_THRESHOLD = 20;       // distance before dragging overrides tap
                ZOOM_SCALE_MAX = 5;                 // can't zoom in closer than this factor
                ZOOM_SCALE_MIN = .1;                // can't zoom out further than this factor
                ZOOM_RATE_KEY = 1.1;                  // zoom speed using the keyboard +/-
                ZOOM_RATE_TOUCH = 1.01;              // zoom speed using multitouch pinchin/pinchout

            // properties
            var ctrlModifier = false,
                shiftModifier = false,
                slideInTransition = false,
                cssanimations = false,
                lastDelta = 0,
                disableSlideNavigation = false,
                currentGallerySize = null,

                windowHeight = 0,
                activeHeight = 0,
                currentSlide = null;

            // promises
            var smallImagesDeferred = $q.defer(),
                mediumImagesDeferred = $q.defer(),
                largeImagesDeferred = $q.defer(),
                thumbnailImagesDeferred = $q.defer();

            // functions
            var throttledKeydownHandler = keydownHandler.throttle(DEBOUNCE_TIME);

            // jquery elements
            var $htmlRoot = $('html'),
                $contentGallery = $element,
                $galleryContainer = $element.find('.gallery-container'),
                $slideContainer = $element.find('.slide-container'),
                $activeSlide = null;

            // scope data
            $scope.imageList = [];
            $scope.embeddedList = [];
            $scope.fullscreenList = [];

            $scope.state = {
                'fullscreen': false,
                'transitions': true,
                'slideActive': false,
                'slideCount': 0,
                'currentSlideIndex': -1,
                'slideContainerWidth': 0,
                'slideWidth': 0
            };

            $scope.slideContainerStyle = {};
            $scope.galleryContainerStyle = {};
            $scope.galleryInterfaceStyle = {};
            $scope.slideStyle = {};

            initialize();

            /* initialize -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function initialize() {

                // watch: smallImageList
                $scope.$watch('smallImageList', function(smallImageList, oldValue) {

                    // if smallImageList is string
                    if (typeof smallImageList === 'string') {
                        $scope.smallImageList = parseImageListString(smallImageList);
                    }
                    smallImagesDeferred.resolve();
                });

                // watch: mediumImageList
                $scope.$watch('mediumImageList', function(mediumImageList, oldValue) {

                    // if mediumImageList is string
                    if (typeof mediumImageList === 'string') {
                        $scope.mediumImageList = parseImageListString(mediumImageList);
                    }
                    mediumImagesDeferred.resolve();
                });

                // watch: largeImageList
                $scope.$watch('largeImageList', function(largeImageList, oldValue) {

                    // if largeImageList is string
                    if (typeof largeImageList === 'string') {
                        $scope.largeImageList = parseImageListString(largeImageList);
                    }
                    largeImagesDeferred.resolve();
                });

                // watch: thumbnailImageList
                $scope.$watch('thumbnailImageList', function(thumbnailImageList, oldValue) {

                    // if thumnailList is string
                    if (typeof thumbnailImageList === 'string') {
                        $scope.thumbnailImageList = parseImageListString(thumbnailImageList);
                    }
                    thumbnailImagesDeferred.resolve();
                });

                // wait for all promises to resolve
                $q.all([smallImagesDeferred.promise, mediumImagesDeferred.promise, largeImagesDeferred.promise, thumbnailImagesDeferred.promise]).then(function(arrayOfResults) {

                    renderContentGallery();
                });
            }

             /* createEventHandlers -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function createEventHandlers() {

                // window: resized
                $(window).on('resize', function(e) {

                    // update window height
                    windowHeight = $(window).height();

                    var gallerySize = getGallerySize($scope.state.fullscreen);

                    // load new gallery
                    if (gallerySize !== currentGallerySize) {

                        currentGallerySize = gallerySize;

                        loadGallery($scope.state.currentSlideIndex);
                    }

                    $timeout(function() {
                        setGalleryHeight();
                    }, 500);
                });

                // window: keyup
                $(window).on('keydown', function(e) {
                    throttledKeydownHandler(e.which);
                });

                // window: keyup
                $(window).on('keyup', function(e) {

                    disableSlideNavigation = false;

                    // reset throttle
                    throttledKeydownHandler = keydownHandler.throttle(DEBOUNCE_TIME);

                    // ctrl
                    if (e.which === 17) {
                        ctrlModifier = false;

                    // shift
                    } else if (e.which == 16) {
                        shiftModifier = false;

                    // escape
                    } else if (e.which === 27) {

                        $rootScope.safeApply(function() {
                            disableFullscreen();
                        });
                    }
                });

                // content gallery: mousedown
                $contentGallery.on('mousedown', function(e) {
                    disableSlideNavigation = false;
                });

                // content gallery: drag
                $contentGallery.hammer().on('drag', function(e) {

                    if ($scope.state.fullscreen) {

                        var delta = e.gesture.deltaY;

                        rafId = requestAnimationFrame(function() {
                            scrollCurrentSlideBy(delta);
                        });

                        e.gesture.preventDefault();
                    }
                });

                // content gallery: drag end
                $contentGallery.hammer().on('dragend', function(e) {

                    if ($scope.state.fullscreen) {

                        // disable slide navigation if drag distance greater than threshold
                        if (e.gesture.distance > DRAG_DISTANCE_THRESHOLD) {
                            disableSlideNavigation = true;
                        }
                        lastDelta = 0;

                        e.gesture.preventDefault();
                    }
                });

                // content gallery: tap
                $contentGallery.hammer().on('tap', function(e) {
                    disableSlideNavigation = false;
                });

                // content gallery: tap
                $contentGallery.hammer().on('release', function(e) {
                    disableSlideNavigation = false;
                });

                // content gallery: swipeleft
                $contentGallery.hammer({'swipe_velocity': SWIPE_VELOCITY}).on('swipeleft', function(e) {
                    $rootScope.safeApply(function() {
                        nextSlide();
                    });
                });

                // content gallery: swiperight
                $contentGallery.hammer({'swipe_velocity': SWIPE_VELOCITY}).on('swiperight', function(e) {
                    $rootScope.safeApply(function() {
                        previousSlide();
                    });
                });

                // content gallery: pinchin
                $contentGallery.hammer().on('pinchin', function(e) {
                    // zoom out
                    zoom(1 / ZOOM_RATE_TOUCH);
                });

                // content gallery: pinchout
                $contentGallery.hammer().on('pinchout', function(e) {
                    // zoom in
                    zoom(ZOOM_RATE_TOUCH);
                });

                // slideContainer: transitionend
                $slideContainer.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd msTransitionEnd', function() {
                    slideInTransition = false;
                });

                // thumbnail-gallery:set-active
                $scope.$on('thumbnail-gallery:set-active', function(e, index) {
                    setActiveSlide(index, false);
                });

                // imageViewer: mousewheel
                $contentGallery.bind('mousewheel', handleMouseWheelEvent);
            }

            /* parseImageListString -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function parseImageListString(imageListString) {

                var imageURLs = imageListString.split(',');
                var imageObjectList = [];

                imageURLs.each(function(url) {

                    if (url) {
                        imageObjectList.push({'url': url});
                    }
                });

                return imageObjectList;
            }

            /* renderContentGallery -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function renderContentGallery() {

                createEventHandlers();

                // set window height
                windowHeight = $(window).height();

                // convert to integer
                $scope.thumbnailHeight = parseInt($scope.thumbnailHeight, 10);
                $scope.thumbnailWidth = parseInt($scope.thumbnailWidth, 10);

                // modernizr detect cssanimations
                if ($htmlRoot.hasClass('cssanimations')) {
                    cssanimations = true;
                }

                // calculate container and slide width
                $scope.state.slideCount = $scope.largeImageList.length;
                $scope.state.slideContainerWidth = $scope.state.slideCount * 100;
                $scope.state.slideWidth = 100 / $scope.state.slideCount;

                // apply basic gallery styles
                $scope.slideContainerStyle = {
                    'width': $scope.state.slideContainerWidth + '%'
                };
                $scope.galleryInterfaceStyle = {
                    'bottom': $scope.thumbnailHeight + 'px'
                };
                $scope.slideStyle = {
                    'width': $scope.state.slideWidth + '%'
                };

                // load gallery
                loadGallery(0);
            }

            /* loadGallery -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function loadGallery(activeIndex) {

                currentGallerySize = getGallerySize($scope.state.fullscreen),

                $scope.imageList = getImageList(currentGallerySize, $scope.state.fullscreen);

                // load images
                $scope.imageList.each(function(image, index) {
                    loadImage(image, index, activeIndex);
                });
            }

            /* loadImage
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function loadImage(image, index, activeIndex) {

                var loadedImage = new Image();
                loadedImage.src = image.url;

                // on image load
                loadedImage.onload = function() {

                    // set image properties
                    image.width = loadedImage.width;
                    image.height = loadedImage.height;
                    image.loaded = true;
                    image.yPos = 0;
                    image.atTop = true;
                    image.atBottom = false;

                    // set active image once first image has loaded
                    if (index === activeIndex) {

                        // wait for image to render on page
                        $timeout(function() {

                            // set slide to active state
                            $scope.state.slideActive = true;
                            setActiveSlide(activeIndex, true);

                        }, 500);
                    }
                };
            }

            /* getImageList -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function getImageList(gallerySize, fullscreen) {

                var imageList = null;

                switch(gallerySize) {

                    case 'small':
                        imageList = $scope.smallImageList;
                        break;

                    case 'medium':
                        imageList = $scope.mediumImageList;
                        break;

                    case 'large':
                        imageList = $scope.largeImageList;
                        break;
                }

                return imageList;
            }

            /* getGallerySize -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function getGallerySize(fullscreen) {

                // get usable width
                var usableWidth = $contentGallery.width();
                if (fullscreen) {
                    usableWidth = $(window).width();
                }

                var smallWidth = parseInt($scope.smallWidth, 10),
                    mediumWidth = parseInt($scope.mediumWidth, 10),
                    largeWidth = parseInt($scope.largeWidth, 10);

                var imageSize = null;

                // small
                if (usableWidth <= smallWidth) {
                    imageSize = 'small';

                // medium
                } else if (usableWidth <= mediumWidth) {
                    imageSize = 'medium';

                // large
                } else {
                    imageSize = 'large';
                }

                return imageSize;
            }

            /* keydownHandler
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function keydownHandler(key) {

                if (key === 17) {
                    // reset throttle
                    throttledKeydownHandler = keydownHandler.throttle(DEBOUNCE_TIME);
                    ctrlModifier = true;
                }

                // shift
                if (key == 16) {
                    shiftModifier = true;
                }

                // previous slide
                if (key === 37) {
                    $rootScope.safeApply(function() {
                        if (ctrlModifier) {
                            setActiveSlide(0);
                        } else {
                            previousSlide();
                        }
                    });

                // next slide
                } else if (key === 39) {
                    $rootScope.safeApply(function() {
                        if (ctrlModifier) {
                            setActiveSlide($scope.state.slideCount - 1);
                        } else {
                            nextSlide();
                        }
                    });

                // zoom in with the + key
                } else if (((key == 61) || (key == 187)) && shiftModifier) {
                    zoom(ZOOM_RATE_KEY);

                // zoom out with the - key
                } else if (((key == 173) || (key == 189)) && !shiftModifier) {
                    zoom(1 / ZOOM_RATE_KEY);
                }
            }

            /* setActiveSlide -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setActiveSlide(index, emitEvent) {

                if (disableSlideNavigation) return;

                // reset the current activeSlide's scale
                if ($activeSlide) {
                    $activeSlide.scale = 1
                }

                lastDelta = 0;

                // emit event by default
                emitEvent = (typeof emitEvent === 'undefined' || emitEvent) ? true : false;

                // set active if index greater than -1, less than imageList length, and image at index is loaded
                if (index > -1 && index < $scope.imageList.length && $scope.imageList[index].loaded) {

                    if (cssanimations) {
                        slideInTransition = true;
                    }

                    // save current index
                    $scope.state.currentSlideIndex = index;

                    // set active slide
                    $activeSlide = $slideContainer.find('.slide-' + index);

                    // set current slide
                    currentSlide = $scope.imageList[index];
                    currentSlide.scale = 1

                    // set slide container horizontal position
                    scrollToActiveSlide(index);

                    // broadcast active selection
                    if (emitEvent) {
                        $scope.$broadcast('content-gallery:set-active', index);
                    }
                }
            }

            /* scrollToActiveSlide -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollToActiveSlide() {

                // calculate translation amount
                var xPosition = $scope.state.currentSlideIndex * $scope.state.slideWidth,
                    translateType = '%';

                // use different xPosition method for mobile
                if (typeof window.orientation !== 'undefined') {
                    xPosition = $activeSlide.position().left;
                    translateType = 'px';
                }

                // apply transform/width styles
                $scope.slideContainerStyle = {
                    'width': ($scope.state.slideCount * 100) + '%',
                    '-webkit-transform': 'translate3d(' + -xPosition + translateType + ', 0px, 0px)',
                    '-moz-transform': 'translate3d(' + -xPosition + translateType + ', 0px, 0px)',
                    '-ms-transform': 'translate(' + -xPosition + translateType + ', 0px)',
                    '-o-transform': 'translate3d(' + -xPosition + translateType + ', 0px, 0px)',
                    'transform': 'translate3d(' + -xPosition + translateType + ', 0px, 0px)'
                };

                setGalleryHeight();

                resetScroll();
            }

            /* setGalleryHeight - set gallery height based on active slide height
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setGalleryHeight() {

                // get active slide element
                windowHeight = $(window).height();
                activeHeight = $activeSlide.height();

                if (activeHeight > 0) {

                    var galleryStyles = {};

                    // fullscreen
                    if ($scope.state.fullscreen) {

                        var fullScreenWindowHeight = windowHeight - $scope.thumbnailHeight;

                        var topPadding = 0;
                        if (!isImageTallerThanWindow()) {
                            topPadding = (fullScreenWindowHeight - activeHeight) / 2;
                        }

                        // gallery styles
                        galleryStyles = {
                            'height': fullScreenWindowHeight + 'px',
                            '-webkit-transform': 'translate3d(0px, ' + topPadding + 'px, 0px)',
                            '-moz-transform': 'translate3d(0px, ' + topPadding + 'px, 0px)',
                            '-ms-transform': 'translate(0px, ' + topPadding + 'px)',
                            '-o-transform': 'translate3d(0px, ' + topPadding + 'px, 0px)',
                            'transform': 'translate3d(0px, ' + topPadding + 'px, 0px)'
                        };

                    // embedded
                    } else {

                        // gallery styles
                        galleryStyles['height'] = activeHeight + 'px';
                    }

                    // set styles
                    $scope.galleryContainerStyle = galleryStyles;
                }
            }

            /* extractDelta - get mouse wheel delta
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function extractDelta(e) {

                if (e.wheelDelta) {
                    return e.wheelDelta;
                }

                if (e.originalEvent.detail) {
                    return e.originalEvent.detail * -40;
                }

                if (e.originalEvent && e.originalEvent.wheelDelta) {
                    return e.originalEvent.wheelDelta;
                }
            }

            /* handleMouseWheelEvent - handle mouse scroll event
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function handleMouseWheelEvent(e) {

                // only for fullscreen mode
                if ($scope.state.fullscreen) {
                    var delta = extractDelta(e);
                    lastDelta = 0;

                    // reduce delta
                    delta = delta / 3;

                    // set new scroll position
                    scrollCurrentSlideBy(delta);
                }
            }

            /* scrollCurrentSlideBy - add delta to current vertical position
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollCurrentSlideBy(delta) {

                var yPosition = currentSlide.yPos;

                yPosition += delta - lastDelta;

                lastDelta = delta;

                // scroll slide to new yPosition
                scrollCurrentSlideTo(yPosition);
            }

            /* scrollCurrentSlideByTo - set new vertical position
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollCurrentSlideTo(yPosition) {

                var negativeScrollLimit = windowHeight - activeHeight - SCROLL_MARGIN - $scope.thumbnailHeight;

                $rootScope.safeApply(function() {

                    currentSlide.atBottom = false;
                    currentSlide.atTop = false;

                    // restrict scroll down amount
                    if (yPosition <= negativeScrollLimit) {
                        yPosition = negativeScrollLimit;
                        currentSlide.atBottom = true;
                        currentSlide.atTop = false;
                    }

                    // restrict scroll up amount
                    if (yPosition >= 0) {
                        yPosition = 0;
                        currentSlide.atBottom = false;
                        currentSlide.atTop = true;
                    }
                });

                currentSlide.yPos = yPosition;

                // apply styles
                $activeSlide.css({
                    '-webkit-transform': 'translate3d(0px, ' + yPosition + 'px, 0px) scale(' + currentSlide.scale + ')',
                    '-moz-transform': 'translate3d(0px, ' + yPosition + 'px, 0px) scale(' + currentSlide.scale + ')',
                    '-ms-transform': 'translate(0px, ' + yPosition + 'px) scale(' + currentSlide.scale + ')',
                    '-o-transform': 'translate3d(0px, ' + yPosition + 'px, 0px) scale(' + currentSlide.scale + ')',
                    'transform': 'translate3d(0px, ' + yPosition + 'px, 0px) scale(' + currentSlide.scale + ')'
                });
            }

            /* isImageTallerThanWindow - return true if image height larger than current window height
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function isImageTallerThanWindow() {

                if ($activeSlide) {

                    var $image = $activeSlide.find('img');

                    var imageHeight = $image.height();

                    return (imageHeight > windowHeight - $scope.thumbnailHeight);
                }
            }

            /* resetScroll - reset scroll position to 0
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function resetScroll() {

                lastDelta = 0;
                scrollCurrentSlideTo(0);
            }

            /* nextSlide -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function nextSlide() {
                setActiveSlide($scope.state.currentSlideIndex + 1);
            }

            /* previousSlide -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function previousSlide() {
                setActiveSlide($scope.state.currentSlideIndex - 1);
            }

            /* scrollUp - scroll up in fixed increment
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollUp() {
                scrollCurrentSlideBy(100);
                lastDelta = 0;
            }

            /* scrollDown - scroll down in fixed increment
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollDown() {
                scrollCurrentSlideBy(-100);
                lastDelta = 0;
            }

            /* zoom - zoom in/out on the current image by given amount
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function zoom(amount) {
                // only zoom in fullscreen mode
                if ($scope.state.fullscreen) {
                    // initialize the current slide's scale if needed
                    if (currentSlide.scale == null) {
                        currentSlide.scale = 1;
                    }

                    // change the scale based on the value passed in
                    currentSlide.scale *= amount

                    // limi the scale between min and max values
                    if (currentSlide.scale < ZOOM_SCALE_MIN) {
                        currentSlide.scale = ZOOM_SCALE_MIN;
                    }
                    else if (currentSlide.scale > ZOOM_SCALE_MAX) {
                        currentSlide.scale = ZOOM_SCALE_MAX;
                    }

                    // set the scale in css, keeping the current scroll position
                    $activeSlide.css({
                        '-webkit-transform': 'translate3d(0px, ' + currentSlide.yPos + 'px, 0px) scale(' + currentSlide.scale + ')',
                        '-moz-transform': 'translate3d(0px, ' + currentSlide.yPos + 'px, 0px) scale(' + currentSlide.scale + ')',
                        '-ms-transform': 'translate(0px, ' + currentSlide.yPos + 'px) scale(' + currentSlide.scale + ')',
                        '-o-transform': 'translate3d(0px, ' + currentSlide.yPos + 'px, 0px) scale(' + currentSlide.scale + ')',
                        'transform': 'translate3d(0px, ' + currentSlide.yPos + 'px, 0px) scale(' + currentSlide.scale + ')'
                    });


                }
            }

            /* enableFullscreen -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function enableFullscreen() {

                if ($scope.state.fullscreen) return;

                $htmlRoot.addClass('overflow-hidden');
                $scope.state.fullscreen = true;

                // load gallery
                loadGallery($scope.state.currentSlideIndex);
            }

            /* disableFullscreen -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function disableFullscreen() {

                if (!$scope.state.fullscreen) return;

                $htmlRoot.removeClass('overflow-hidden');
                $scope.state.fullscreen = false;

                // load gallery
                loadGallery($scope.state.currentSlideIndex);
            }

            /* disableTransitions -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function disableTransitions(time) {

                // disable transitions
                $scope.state.transitions = false;

                // renabled after delay
                $timeout(function() {
                    $scope.state.transitions = true;
                }, time);
            }

            /* Scope Methods
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            $scope.setActiveSlide = setActiveSlide;
            $scope.nextSlide = nextSlide;
            $scope.previousSlide = previousSlide;
            $scope.scrollUp = scrollUp;
            $scope.scrollDown = scrollDown;
            $scope.isImageTallerThanWindow = isImageTallerThanWindow;
            $scope.enableFullscreen = enableFullscreen;
            $scope.disableFullscreen = disableFullscreen;
        }
    };
}]);
;var App = angular.module('Hexangular');

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* ngTap Directive -
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
App.directive('ngTap', ['$rootScope', function($rootScope) {

    return {
        link: function($scope, $element, $attrs) {

            $element.fastClick(function (e) {
                $scope.$apply($attrs['ngTap']);
            });
        }
    };

}]);
;var App = angular.module('Hexangular');

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Thumbnail Gallery Directive -
* Requires Modernizr detect: cssanimations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
App.directive('thumbnailGallery', ['$rootScope', '$timeout', function($rootScope, $timeout) {

    return {
        restrict: 'A',
        template: '<div class="thumbnail-gallery"><div class="thumbnail-viewport-container"><!-- thumbnail interface --><div class="activation-area previous" ng-tap="previousPage()" ng-hide="isImageFullyViewable(0)"><div class="navigation-button previous only-icon icon-chevron-left"></div></div><div class="activation-area next" ng-tap="nextPage()" ng-hide="isImageFullyViewable(9999)"><div class="navigation-button next only-icon icon-chevron-right"></div></div><!-- thumbnail container --><div class="thumbnail-container" ng-style="thumbnailContainerStyle"><div class="thumbnail thumbnail-[[ key ]]" ng-style="thumbnailStyle" ng-class="{active: key == state.currentThumbnailIndex}" ng-repeat="(key, image) in thumbnailList" ng-tap="setActiveThumbnail(key)"><img class="image-thumbnail" ng-style="thumbnailImageStyle" ng-src="[[ image.url ]]"></div></div></div></div>',
        replace: false,
        scope: {
            thumbnailList: '=',
            width: '=',
            fullscreen: '=',
            spacing: '@'
        },

        link: function($scope, $element, $attrs) {

            // constants
            var CALCULATION_ERROR_PADDING = 2;

            // properties
            var thumbnailInTransition = false,
                allThumbnailsLoaded = false,
                cssanimations = false;

                // viewport properties
                vpProperties = {
                    'width': 0,
                    'height': 0,
                    'fullyVisibleImages': 0,
                    'maxTranslateAmount': 0,
                    'innerWidth': 0
                };

                // thumbnail container properties
                tcProperties = {
                    'currentTranslation': 0,
                    'thumbnailCount': 0,
                    'width': 0
                };
                thumbnailDimensions = {
                    'width': 0,
                    'height': 0
                };

            var throttledResizeUpdate = resizeUpdate.debounce(500);

            // jquery elements
            var $thumbnailGallery = $element,
                $viewportContainer = $element.find('.thumbnail-viewport-container'),
                $thumbnailContainer = $element.find('.thumbnail-container'),
                $activeThumbnail = null;

            // scope data
            $scope.state = {
                'currentThumbnailIndex': -1,
                'currentPageIndex': 0
            };

            $scope.thumbnailContainerStyle = {};
            $scope.thumbnailStyle = {};
            $scope.thumbnailImageStyle = {};

            // wait for thumbnailList data before intialization
            $scope.$watch('thumbnailList', function(thumbnailList, oldValue) {
                initialize();
            });

            /* initialize -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function initialize() {

                createEventHandlers();

                // modernizr detect cssanimations
                if ($('html').hasClass('cssanimations')) {
                    cssanimations = true;
                }

                // calculate container and thumbnail width
                tcProperties.thumbnailCount = $scope.thumbnailList.length;

                // apply styles
                $scope.thumbnailStyle = {
                };
                $scope.thumbnailImageStyle = {
                    'padding-right': $scope.spacing + 'px',
                    'width': $scope.width + 'px'
                };
            }

            /* createEventHandlers -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function createEventHandlers() {

                // watch: fullscreen
                $scope.$watch('fullscreen', function(fullscreen, oldValue) {

                    if (typeof fullscreen !== 'undefined') {
                        (function() {
                            resizeUpdate();
                        }).delay(500);
                    }
                });

                // window: resized
                $(window).on('resize', function(e) {

                    if (allThumbnailsLoaded) {
                        throttledResizeUpdate();
                    }
                });

                // thumbnailContainer: transitionend
                $thumbnailContainer.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd msTransitionEnd', function() {

                    thumbnailInTransition = false;
                });

                // viewportContainer: all images loaded
                $viewportContainer.imagesLoaded(function() {

                    // wait for image to render on page
                    $timeout(function() {

                        allThumbnailsLoaded = true;

                        calculateDimensions();

                        $scope.thumbnailContainerStyle = {
                            'width': tcProperties.width
                        };

                    }, 0);
                });

                // content-gallery:set-active
                $scope.$on('content-gallery:set-active', function(e, index) {
                    setActiveThumbnail(index, false);
                });
            }

            /* resizeUpdate -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function resizeUpdate() {

                calculateDimensions();
                setFirstViewableImage($scope.state.currentThumbnailIndex);
            }

            /* calculateDimensions -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function calculateDimensions() {

                var $thumbnail = $thumbnailContainer.find('.thumbnail-0');

                // thumbnail dimensions
                thumbnailDimensions.width = $thumbnail.width() + 1;
                thumbnailDimensions.height = $thumbnail.height();

                // viewport properties
                vpProperties.width = $viewportContainer.width();
                vpProperties.height = $viewportContainer.height();
                vpProperties.fullyVisibleImages = Math.floor(vpProperties.width / thumbnailDimensions.width);

                // thumbnail container properties
                tcProperties.width = tcProperties.thumbnailCount * thumbnailDimensions.width;

                // calculate max translate (add in drift + spacing)
                vpProperties.maxTranslateAmount = -(vpProperties.width - tcProperties.width + (tcProperties.thumbnailCount) + parseInt($scope.spacing, 10));

                if (vpProperties.maxTranslateAmount < 0) {
                    vpProperties.maxTranslateAmount = 0;
                }
            }

            /* setActiveThumbnail -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setActiveThumbnail(index, emitEvent) {

                // emit event by default
                emitEvent = (typeof emitEvent === 'undefined') ? true : false;

                // set active if index less than thumbnailList lenght, thumbnail not in transitions and image at index is loaded
                if (index < $scope.thumbnailList.length && !thumbnailInTransition && allThumbnailsLoaded) {

                    // previous image not in full view - go back
                    if (!isImageFullyViewable(index - 1) && index !== tcProperties.thumbnailCount - 1) {
                        setFirstViewableImage(index - 1);

                    // next image not in full view - go forward
                    } else if (!isImageFullyViewable(index + 1)) {
                        setLastViewableImage(index + 1);
                    }

                    // save current index
                    $scope.state.currentThumbnailIndex = index;
                    $scope.state.currentPageIndex = index;

                    // set active thumbnail
                    $activeThumbnail = $thumbnailContainer.find('.thumbnail-' + index);

                    // emit active selection
                    if (emitEvent) {
                        $scope.$emit('thumbnail-gallery:set-active', index);
                    }
                }
            }

            /* isImageFullyViewable -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function isImageFullyViewable(index) {

                if (index < 0) {
                    index = 0;
                } else if (index > tcProperties.thumbnailCount - 1) {
                    index = tcProperties.thumbnailCount - 1;
                }

                var imageStart = getImagePosition(index);
                var imageEnd = imageStart + thumbnailDimensions.width;

                var tcViewStart = tcProperties.currentTranslation;
                var tcViewEnd = tcProperties.currentTranslation + vpProperties.width + parseInt($scope.spacing, 10) + CALCULATION_ERROR_PADDING;

                if (imageStart >= tcViewStart && imageEnd <= tcViewEnd) {
                    return true;
                }
                return false;
            }

            /* setFirstViewableImage -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setFirstViewableImage(index) {

                if (index < 0) {
                    index = 0;
                }

                var translateAmount = getImagePosition(index);
                translateThumbnailContainer(translateAmount);
            }

            /* setLastViewableImage -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setLastViewableImage(index) {

                if (index > tcProperties.thumbnailCount - 1) {
                    index = tcProperties.thumbnailCount - 1;
                }

                var translateAmount = getImagePosition(index) - vpProperties.width + thumbnailDimensions.width - parseInt($scope.spacing, 10) - CALCULATION_ERROR_PADDING;

                translateThumbnailContainer(translateAmount);
            }

            /* getImagePosition -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function getImagePosition(index) {
                return (thumbnailDimensions.width * index) - (index * 1);
            }

            /* translateThumbnailContainer -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function translateThumbnailContainer(translateAmount) {

                if (translateAmount > vpProperties.maxTranslateAmount) {
                    translateAmount = vpProperties.maxTranslateAmount;

                } else if (translateAmount < 0) {
                    translateAmount = 0;
                }

                // set style
                setThumbnailContainerStyle(translateAmount);
            }

            /* setThumbnailContainerStyle -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setThumbnailContainerStyle(translateAmount) {

                tcProperties.currentTranslation = translateAmount;

                $rootScope.safeApply(function() {

                    // apply transform/width styles
                    $scope.thumbnailContainerStyle = {
                        'width': tcProperties.width,
                        '-webkit-transform': 'translate3d(' + -translateAmount + 'px, 0px, 0px)',
                        '-moz-transform': 'translate3d(' + -translateAmount + 'px, 0px, 0px)',
                        '-ms-transform': 'translate(' + -translateAmount + 'px, 0px)',
                        '-o-transform': 'translate3d(' + -translateAmount + 'px, 0px, 0px)',
                        'transform': 'translate3d(' + -translateAmount + 'px, 0px, 0px)'
                    };
                });
            }

            /* nextPage - find first non-fully visible image moving forward and set as first viewable
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function nextPage() {

                var thumbInFullView = true,
                    currentIndex = $scope.state.currentPageIndex;

                if (cssanimations) {
                    thumbnailInTransition = true;
                }

                while (thumbInFullView) {
                    thumbInFullView = isImageFullyViewable(currentIndex);
                    currentIndex++;
                }

                $scope.state.currentPageIndex = --currentIndex;
                setFirstViewableImage($scope.state.currentPageIndex);
            }

            /* previousPage - find first non-fully visible image moving backward and set as last viewable
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function previousPage() {

                var thumbInFullView = true,
                    currentIndex = $scope.state.currentPageIndex;

                if (cssanimations) {
                    thumbnailInTransition = true;
                }

                while (thumbInFullView) {
                    thumbInFullView = isImageFullyViewable(currentIndex);
                    currentIndex--;
                }

                $scope.state.currentPageIndex = ++currentIndex;
                setLastViewableImage($scope.state.currentPageIndex);
            }

            /* Scope Methods
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            $scope.setActiveThumbnail = setActiveThumbnail;
            $scope.isImageFullyViewable = isImageFullyViewable;
            $scope.previousPage = previousPage;
            $scope.nextPage = nextPage;
        }
    };
}]);
;var App = angular.module('Hexangular');

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Touch Scroller Directive -
* Requires Modernizr detect: cssanimations, csstransforms, csstransforms3d
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
App.directive('touchScroller', ['$rootScope', '$timeout', function($rootScope, $timeout) {

    return {
        restrict: 'A',
        scope: true,

        link: function($scope, $element, $attrs) {

            // contants

            // properties
            var cssanimations = false,
                csstransforms = false,
                csstransforms3d = false,

                touchStart = null,
                touchExceeded = false,
                mousedown = false;

            // objects
            var scroller = null;

            // jquery elements
            var $htmlRoot = $('html'),
                $viewPort = null,
                $contentContainer = null;

            $scope.state = {
            };

            initialize();

            /* initialize -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function initialize() {

                // modernizr detect cssanimations
                if ($htmlRoot.hasClass('cssanimations')) {
                    cssanimations = true;
                }
                // modernizr detect csstransforms
                if ($htmlRoot.hasClass('csstransforms')) {
                    csstransforms = true;
                }
                // modernizr detect csstransforms3d
                if ($htmlRoot.hasClass('csstransforms3d')) {
                    csstransforms3d = true;
                }

                // event: touch-scroller:initialize
                $scope.$on('touch-scroller:initialize', function(e, scrollerName) {
                    intializeScroller(scrollerName);
                });

                // event: touch-scroller:scroll-to
                $scope.$on('touch-scroller:scroll-to', function(e, properties) {
                    scrollerScrollTo(properties.scrollerName, properties.x, properties.y);
                });

                // event: touch-scroller:update-bounding-box
                $scope.$on('touch-scroller:update-bounding-box', function(e, properties) {
                    updateBoundingBox(false);
                });
            }

            /* intializeScroller -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function intializeScroller(scrollerName) {

                if ($attrs.touchScroller === scrollerName) {

                    console.log('init touch scroller', scrollerName);

                    // set jquery elements
                    $viewPort = $($attrs.viewPort);
                    $contentContainer = $($attrs.contentContainer);

                    // Initialize Scroller
                    scroller = new Scroller(transformContent, {
                        scrollingX: ($attrs.scrollingX && $attrs.scrollingX === 'true') ? true : false,
                        scrollingY: ($attrs.scrollingY && $attrs.scrollingY === 'true') ? true : false,
                        paging: ($attrs.paging && $attrs.paging === 'true') ? true : false,
                        locking: ($attrs.locking && $attrs.locking === 'true') ? true : false,
                        bouncing: ($attrs.bouncing && $attrs.bouncing === 'true') ? true : false,
                        animating: ($attrs.animating && $attrs.animating === 'true') ? true : false,
                        scrollingComplete: scrollingComplete
                    });

                    updateBoundingBox(true);

                    createEventHandlers();
                }
            }

            /* createEventHandlers -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function createEventHandlers() {

                // window: resized
                $(window).on('resize', function(e) {
                    updateBoundingBox(false);
                });

                /* mobile touch events */
                if ($attrs.touch === 'true') {

                    // viewPort: touchstart
                    $viewPort.hammer().on('touch', function(e) {

                        console.log('touch');

                        scroller.doTouchStart(e.gesture.touches, e.timeStamp);
                    });

                    // horizontal scrolling
                    if ($attrs.scrollingX && $attrs.scrollingX === 'true') {

                        // viewPort: dragleft
                        $viewPort.hammer().on('dragleft', function(e) {
                            console.log('dragleft');
                            scroller.doTouchMove(e.gesture.touches, e.timeStamp);

                            e.preventDefault();
                            e.gesture.preventDefault();
                        });

                        // viewPort: dragright
                        $viewPort.hammer().on('dragright', function(e) {
                            console.log('dragright');
                            scroller.doTouchMove(e.gesture.touches, e.timeStamp);

                            e.preventDefault();
                            e.gesture.preventDefault();
                        });

                    // vertical scrolling
                    } else if ($attrs.scrollingY && $attrs.scrollingY === 'true') {

                        // viewPort: dragdown
                        $viewPort.hammer().on('dragdown', function(e) {
                            console.log('dragdown');

                            scroller.doTouchMove(e.gesture.touches, e.timeStamp);

                            e.preventDefault();
                            e.gesture.preventDefault();
                        });

                        // viewPort: dragup
                        $viewPort.hammer().on('dragup', function(e) {
                            console.log('dragup');

                            scroller.doTouchMove(e.gesture.touches, e.timeStamp);

                            e.preventDefault();
                            e.gesture.preventDefault();
                        });
                    }

                    // viewPort: release
                    $viewPort.hammer().on('dragend', function(e) {
                        scroller.doTouchEnd(e.timeStamp);
                    });
                }
            }

            /* transformContent - create render function
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            var transformContent = (function(global) {

                var docStyle = document.documentElement.style;

                // get vendor prefix
                var vendorPrefix = '';
                if (global.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
                    vendorPrefix = 'O';

                } else if ('MozAppearance' in docStyle) {
                    vendorPrefix = 'Moz';

                } else if ('WebkitAppearance' in docStyle) {
                    vendorPrefix = 'Webkit';

                } else if (typeof navigator.cpuClass === 'string') {
                    vendorPrefix = 'ms';
                }

                var transformProperty = vendorPrefix + 'Transform';

                // return render function

                // 3d transform
                if (csstransforms3d) {

                    return function(left, top, zoom) {
                        $contentContainer[0].style[transformProperty] = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
                    };

                // 2d transform
                } else if (csstransforms) {

                    return function(left, top, zoom) {
                        $contentContainer[0].style[transformProperty] = 'translate(' + (-left) + 'px,' + (-top) + 'px) scale(' + zoom + ')';
                    };

                // no transforms
                } else {

                    return function(left, top, zoom) {
                        $contentContainer[0].style.marginLeft = left ? (-left/zoom) + 'px' : '';
                        $contentContainer[0].style.marginTop = top ? (-top/zoom) + 'px' : '';
                        $contentContainer[0].style.zoom = zoom || '';
                    };
                }

            })(window);


            /* scrollerScrollTo -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollerScrollTo(scrollerName, x, y) {

                if ($attrs.touchScroller === scrollerName) {

                    scroller.scrollTo(x, y, false);
                }
            }

            /* scrollingComplete -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollingComplete() {

                var properties = {
                    'values': scroller.getValues(),
                    'scrollerName': $attrs.touchScroller
                };

                $rootScope.$broadcast('touch-scroller:scrolling-complete', properties);
            }

            /* updateBoundingBox -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function updateBoundingBox(updatePosition) {

                var container = $viewPort[0];
                var content = $contentContainer[0];

                // Setup Scroller
                var rect = container.getBoundingClientRect();

                if (updatePosition) {
                    scroller.setPosition(rect.left+container.clientLeft, rect.top+container.clientTop);
                }

                scroller.setDimensions(container.clientWidth, container.clientHeight, content.offsetWidth, content.offsetHeight);
            }
        }
    };
}]);
