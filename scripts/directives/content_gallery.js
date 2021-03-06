var App = angular.module('Hexangular');

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Content Gallery Directive -
* Requires Modernizr detect: cssanimations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
App.directive('contentGallery', ['$rootScope', '$timeout', '$q', function($rootScope, $timeout, $q) {

    return {
        restrict: 'A',
        template: '@@include("../../partials/content_gallery.html")',
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
                ZOOM_RATE_TAP = 1.8;                // zoom speed when tapping the image
                ZOOM_RATE_TOUCH = 1.01;             // zoom speed when using multitouch pinchin/pinchout
                ZOOM_RATE_WHEEL = 1.15;             // zoom speed when using the mouse wheel

            // properties
            var ctrlModifier = false,
                slideInTransition = false,
                cssanimations = false,
                lastDeltaY = 0,
                lastDeltaX = 0,
                disableSlideNavigation = false,
                currentGallerySize = null,

                windowHeight = 0,
                windowWidth = 0,
                activeHeight = 0,
                activeWidth = 0,
                currentSlide = null,
                modeZoom = false;

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
                $galleryInterface = $element.find('.gallery-interface'),
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
                    windowWidth = $(window).width();

                    updateGallerySize();
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
                        
                        var deltaY = e.gesture.deltaY;
                        var deltaX = 0;

                        // side-panning can only happen when the image is wider than the screen
                        if ($activeSlide.find("img").width() * currentSlide.scale > $activeSlide.width()) {
                            deltaX = e.gesture.deltaX;
                        }

                        // show the move cursor
                        updateCursor(true);

                        rafId = requestAnimationFrame(function() {
                            scrollCurrentSlideBy(deltaX, deltaY);
                        });

                        e.gesture.preventDefault();
                    }
                });

                // content gallery: drag end
                $contentGallery.hammer().on('dragend', function(e) {

                    if ($scope.state.fullscreen) {

                        // return to the current cursor mode
                        updateCursor();

                        // disable slide navigation if drag distance greater than threshold
                        if (e.gesture.distance > DRAG_DISTANCE_THRESHOLD) {
                            disableSlideNavigation = true;
                        }
                        lastDeltaY = 0;
                        lastDeltaX = 0;

                        e.gesture.preventDefault();
                    }
                });

                // content gallery: tap
                $contentGallery.hammer().on('tap', function(e) {
                    disableSlideNavigation = false;

                    // only tap to zoom in fullscreen mode, and not when changing pages
                    if ($scope.state.fullscreen && (e.target == $galleryInterface.get(0))) {

                        // Toggle zoom mode
                        setModeZoom(!modeZoom);

                        // if entering zoom mode
                        if (modeZoom) {
                            // zoom in
                            zoom(ZOOM_RATE_TAP);

                        // otherwise leaving zoom mode
                        } else {
                            // zoom out to scale 1
                            zoom(1 / currentSlide.scale);

                            // re-center the image
                            scrollCurrentSlideTo(0, 0);
                        }
                    }
                });

                // content gallery: release
                $contentGallery.hammer().on('release', function(e) {
                    disableSlideNavigation = false;
                });

                // content gallery: swipeleft
                $contentGallery.hammer({'swipe_velocity': SWIPE_VELOCITY}).on('swipeleft', function(e) {
                    // disable swiping in zoom mode
                    if (!modeZoom) {
                        $rootScope.safeApply(function() {
                            nextSlide();
                        });
                    }
                });

                // content gallery: swiperight
                $contentGallery.hammer({'swipe_velocity': SWIPE_VELOCITY}).on('swiperight', function(e) {
                    // disable swiping in zoom mode
                    if (!modeZoom) {
                        $rootScope.safeApply(function() {
                            previousSlide();
                        });
                    }
                });

                // content gallery: pinchin
                $contentGallery.on('pinchin', function(e) {
                    if (modeZoom) {
                        // zoom out
                        zoom(1 / ZOOM_RATE_TOUCH);
                    }
                });

                // content gallery: pinchout
                $contentGallery.hammer().on('pinchout', function(e) {
                    if (modeZoom) {
                        // zoom in
                        zoom(ZOOM_RATE_TOUCH);
                    }
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
                    image.xPos = 0;
                    image.atTop = true;
                    image.atBottom = false;
                    image.scale = 1;

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

                lastDeltaY = 0;
                lastDeltaX = 0;

                // emit event by default
                emitEvent = (typeof emitEvent === 'undefined' || emitEvent) ? true : false;

                // set active if index greater than -1, less than imageList length, and image at index is loaded
                if (index > -1 && index < $scope.imageList.length && $scope.imageList[index].loaded) {

                    if (cssanimations) {
                        slideInTransition = true;
                    }

                    // reset modeZoom to normal
                    setModeZoom(false);

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
                windowWidth = $(window).width();
                activeHeight = $activeSlide.height();
                activeWidth = $activeSlide.find("img").width();

                if (activeHeight > 0) {

                    var galleryStyles = {};

                    // fullscreen
                    if ($scope.state.fullscreen) {

                        var fullScreenWindowHeight = windowHeight - $scope.thumbnailHeight;

                        var topPadding = 0;
                        if (!isImageTallerThanWindow()) {
                            topPadding = (fullScreenWindowHeight - activeHeight * currentSlide.scale) / 2;
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

                    // if in zoom mode, zoom
                    if (modeZoom) {
                        if (delta > 0) {
                            // zoom in
                            zoom(ZOOM_RATE_WHEEL);

                        } else {
                            // zoom out
                            zoom(1 / ZOOM_RATE_WHEEL);
                        }

                    // otherwise, pan up/down
                    } else {
                        lastDeltaY = 0;

                        // reduce delta
                        delta = delta / 3;

                        // set new scroll position
                        scrollCurrentSlideBy(0, delta);
                    }
                }
            }

            /* scrollCurrentSlideBy - add delta to current vertical position
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollCurrentSlideBy(deltaX, deltaY) {

                var yPosition = currentSlide.yPos;
                yPosition += deltaY - lastDeltaY;
                lastDeltaY = deltaY;

                var xPosition = currentSlide.xPos;
                xPosition += deltaX - lastDeltaX;
                lastDeltaX = deltaX;

                // scroll slide to newyPosition
                scrollCurrentSlideTo(xPosition, yPosition);
            }

            /* scrollCurrentSlideTo - set new vertical position and horizontal pan position
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollCurrentSlideTo(xPosition, yPosition) {

                // when zoomed, the position of the image boundaries move, but yPosition does not change
                // this offset corrects for this
                var yOffset = (currentSlide.scale == 1) ? 0 : currentSlide.yPos - $activeSlide.position().top;
                var negativeScrollLimitY = windowHeight - (activeHeight * currentSlide.scale) - SCROLL_MARGIN - $scope.thumbnailHeight + yOffset;
                var positiveScrollLimitY = yOffset;

                var xOffset = currentSlide.xPos - $activeSlide.position().left;
                var negativeScrollLimitX = ((windowWidth - (activeWidth * currentSlide.scale)) / 2) - SCROLL_MARGIN;
                var positiveScrollLimitX = -1 * negativeScrollLimitX;

                $rootScope.safeApply(function() {

                    currentSlide.atBottom = false;
                    currentSlide.atTop = false;

                    var currentYPosition = currentSlide.yPos;

                    // restrict scroll down amount
                    if (yPosition <= negativeScrollLimitY) {
                        yPosition = negativeScrollLimitY;
                        currentSlide.atBottom = true;
                        currentSlide.atTop = false;
                    }

                    // restrict scroll up amount
                    if (yPosition >= positiveScrollLimitY) {
                        yPosition = positiveScrollLimitY;
                        currentSlide.atBottom = false;
                        currentSlide.atTop = true;
                    }

                    if ((activeWidth * currentSlide.scale) > windowWidth) {
                        // restrict scroll left amount
                        if (xPosition <= negativeScrollLimitX) {
                            xPosition = negativeScrollLimitX;
                        }

                        // restrict scroll right amount
                        if (xPosition >= positiveScrollLimitX) {
                            xPosition = positiveScrollLimitX;
                        }
                    }
                });

                currentSlide.yPos = yPosition;
                currentSlide.xPos = xPosition;

                // apply styles
                updateCSSActiveSlide();
            }

            /* isImageTallerThanWindow - return true if image height larger than current window height
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function isImageTallerThanWindow() {

                if ($activeSlide) {

                    var $image = $activeSlide.find('img');

                    var imageHeight = $image.height() * currentSlide.scale;

                    return (imageHeight > windowHeight - $scope.thumbnailHeight);
                }
            }

            /* resetScroll - reset scroll position to 0
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function resetScroll() {

                lastDeltaY = 0;
                lastDeltaX = 0;
                scrollCurrentSlideTo(0, 0);
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
                scrollCurrentSlideBy(0, 100);
                lastDeltaY = 0;
            }

            /* scrollDown - scroll down in fixed increment
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function scrollDown() {
                scrollCurrentSlideBy(0, -100);
                lastDeltaY = 0;
            }

            /* zoom - zoom in/out on the current image by given factor
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function zoom(factor) {
                // only zoom in fullscreen mode
                if ($scope.state.fullscreen) {
                    // initialize the current slide's scale if needed
                    if (currentSlide.scale == null) {
                        currentSlide.scale = 1;
                    }

                    // change the scale based on the factor value passed in
                    currentSlide.scale *= factor

                    // limit the scale between min and max values
                    if (currentSlide.scale < ZOOM_SCALE_MIN) {
                        currentSlide.scale = ZOOM_SCALE_MIN;
                    }
                    else if (currentSlide.scale > ZOOM_SCALE_MAX) {
                        currentSlide.scale = ZOOM_SCALE_MAX;
                    }

                    // if zooming out, set the scale in CSS and center the image
                    if (factor < 1) {
                        var xPos = currentSlide.xPos,
                            yPos = currentSlide.yPos;
                        
                        // if zoomed out lower than 1, center the xPosition
                        if (currentSlide.scale < 1) {
                            xPos = 0;
                        }

                        scrollCurrentSlideTo(xPos, yPos);

                    // otherwise zooming in, set the scale in css without moving
                    } else {
                        updateCSSActiveSlide();
                    }

                    // update the gallery size to fit the slide
                    updateGallerySize();
                }
            }

            /* enableFullscreen -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function enableFullscreen() {

                if ($scope.state.fullscreen) return;

                $htmlRoot.addClass('overflow-hidden');
                $scope.state.fullscreen = true;
                updateCursor();

                // load gallery
                loadGallery($scope.state.currentSlideIndex);
            }

            /* disableFullscreen -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function disableFullscreen() {

                if (!$scope.state.fullscreen) return;

                $htmlRoot.removeClass('overflow-hidden');
                $scope.state.fullscreen = false;
                updateCursor();

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
            
            /* update the cursor, given whether or not the user is panning the image
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function updateCursor(panning) {
                // set panning's default value to false
                if (panning == null) {
                    panning = false;
                }

                // if we're not in fullscreen mode
                if (!$scope.state.fullscreen) {
                    // show the normal cursor
                    $galleryInterface.removeClass("cursor-zoom-out");
                    $galleryInterface.removeClass("cursor-zoom-in");
                    $galleryInterface.removeClass("cursor-move");

                // otherwise if currently dragging to pan
                } else if (panning) {
                    // show the move cursor
                    $galleryInterface.removeClass("cursor-zoom-out");
                    $galleryInterface.removeClass("cursor-zoom-in");
                    $galleryInterface.addClass("cursor-move");

                // otherwise if in zoom mode
                } else if (modeZoom) {
                    // show the zoom out cursor
                    $galleryInterface.removeClass("cursor-zoom-in");
                    $galleryInterface.removeClass("cursor-move");
                    $galleryInterface.addClass("cursor-zoom-out");
                
                // otherwise if in normal mode
                } else {
                    // show the zoom in cursor
                    $galleryInterface.removeClass("cursor-zoom-out");
                    $galleryInterface.removeClass("cursor-move");
                    $galleryInterface.addClass("cursor-zoom-in");
                }
            }

            /* update the CSS for $activeSlide
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function updateCSSActiveSlide() {
                var xPos = currentSlide.xPos,
                    yPos = currentSlide.yPos,
                    scale = currentSlide.scale;
                $activeSlide.css({
                    '-webkit-transform': 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0px) scale3d(' + scale + ', ' + scale + ', 1)',
                    '-moz-transform': 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0px) scale3d(' + scale + ', ' + scale + ', 1)',
                    '-ms-transform': 'translate(' + xPos + 'px, ' + yPos + 'px) scale3d(' + scale + ', ' + scale + ', 1)',
                    '-o-transform': 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0px) scale3d(' + scale + ', ' + scale + ', 1)',
                    'transform': 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0px) scale3d(' + scale + ', ' + scale + ', 1)'
                });
            }

            /* recalculate and set the gallery size
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function updateGallerySize() {
                var gallerySize = getGallerySize($scope.state.fullscreen);

                // load new gallery
                if (gallerySize !== currentGallerySize) {

                    currentGallerySize = gallerySize;

                    loadGallery($scope.state.currentSlideIndex);
                }

                $timeout(function() {
                    setGalleryHeight();
                }, 500);
            }

            /* change to zoom mode or normal mode
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function setModeZoom(modeZoomNew) {
                // set modeZoom
                modeZoom = (modeZoomNew === true);

                // update the cursor
                updateCursor();
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
