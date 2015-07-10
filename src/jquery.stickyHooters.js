/**
 *  jquery-sticky-hooters v0.1.0
 *  Lightweight jQuery plugin providing sticky header and footer functionality for tables and lists.
 *
 *  @module     jquery-sticky-hooters
 *  @extends    jQuery
 *
 *  @example
 *      // Configuration object is optional if setting up a table
 *      // with a sticky header and sticky footer.
 *      $(<your-list-container>).stickyHooters({
 *          // these are in the context of <your-list-container>
 *          bodySelector: '<body-selector>',       // {String} default is 'tbody'
 *          footerSelector: '<footer-selector>',   // {String} default is 'tfoot'
 *          headerSelector: '<header-selector>'    // {String} default is 'thead',
 *          top: '<number><units>',                // {String} (CSS value) default is '0'
 *          bottom: '<number><units>'              // {String} (CSS value) default is '0'
 *      });
 *
 *  @author     Kevin Boucher
 *  @license    Dual licensed under MIT and GNU GPL
 */
;(function($, window, document, undefined) {
    'use strict';

    // Defaults and constants
    var pluginName = 'stickyHooters',
        defaults = {
            bodySelector: 'tbody',
            footerSelector: 'tfoot',
            headerSelector: 'thead',
            top: '0',
            bottom: '0'
        },
        classNames = {
            outerWrapper: 'sticky-hooters_wrapper',
            innerWrapper: 'sticky-hooters_sticky-wrapper',
            innerWrapperHead: 'sticky-hooters_sticky-header',
            innerWrapperFoot: 'sticky-hooters_sticky-footer',
        },
        swapNodes = function(a, b) {
            var aParent = a.parentNode;
            var aSibling = a.nextSibling === b ? a : a.nextSibling;
            b.parentNode.insertBefore(a, b);
            aParent.insertBefore(b, aSibling);
        },
        throttle = function(fn, threshhold, scope) {
            threshhold || (threshhold = 250);

            var last, deferTimer;

            return function () {
                var context = scope || this,
                    now = +new Date(),
                    args = arguments;

                if (last && now < last + threshhold) {
                    // hold on to it
                    clearTimeout(deferTimer);
                    deferTimer = setTimeout(function () {
                        last = now;
                        fn.apply(context, args);
                    }, threshhold);
                } else {
                    last = now;
                    fn.apply(context, args);
                }
            };
        };

    // StickyHooters constructor
    function StickyHooters(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);

        this.bodyElement = $(this.settings.bodySelector, this.element)[0];
        this.footerElement = $(this.settings.footerSelector, this.element)[0];
        this.headerElement = $(this.settings.headerSelector, this.element)[0];

        this.isTable = this.element.tagName.toLowerCase() === 'table';
        this.isVisible = function() {
            var elmRect = this.element.getBoundingClientRect();
            return elmRect.top < window.innerHeight && elmRect.bottom > 0;
        };

        this._defaults = defaults;
        this._name = pluginName;
        this._scrollHandler = null;

        this.init();
    }

    $.extend(StickyHooters.prototype, {

        /**
        *  Initializes DOM and sets event listeners.
        *
        *  @method init
        */
        init: function() {
            // Add DOM wrapper to provide known reference point
            $(this.element).wrap('<div class="' + classNames.outerWrapper + '"></div>');

            if (this.footerElement || this.headerElement) {

                // Clone, wrap, decorate and store references to header/footer.
                if (this.footerElement) {
                    this.setupHooter(true);
                    this.footerElement.isFooter = true;
                }
                if (this.headerElement) {
                    this.setupHooter();
                }

                /*
                    Add throttled scroll event listener and trigger scroll
                    event to initialize sticky header/footer positions.
                */
                this._scrollHandler = throttle(this.watchHooters.bind(this), 40);
                window.addEventListener('scroll', this._scrollHandler);
                window.dispatchEvent(new Event('scroll'));
            }
        },

        /**
        *  Decorates DOM elements to support sticky functionality.
        *
        *  @method setupHooter
        *  @param {Boolean} Is this a sticky footer?
        */
        setupHooter: function(isFooter) {
            var insertAction = isFooter ? 'insertAfter' : 'insertBefore',
                element = isFooter ? 'footerElement' : 'headerElement',
                wrapperClasses = [
                    classNames.innerWrapper,
                    isFooter ? classNames.innerWrapperFoot : classNames.innerWrapperHead
                ];

            /**
                1. Create and store header/footer clone
                2. Wrap with sticky-hooters DIV
                3. Conditionally wrap with TABLE (THEAD/TFOOT only)
                5. Hide clone
                6. Append to DOM
             */
            this[element].stickyClone = $(this[element]).clone(false)
                .wrap(
                    $('<div></div>').css({
                        bottom: isFooter ? this.settings.bottom : 'auto',
                        position: 'fixed',
                        top: !isFooter ? this.settings.top : 'auto',
                        'z-index': 9999,
                    }).addClass(wrapperClasses.join(' '))
                )
                .wrap(function () {
                        var classNames = this.element.getAttribute('class');
                        if (this.isTable) {
                            return $('<table></table>').addClass(classNames);
                        }
                        return '';
                    }.bind(this)
                ).parents('.' + classNames.innerWrapper)
                .css('display', 'none')
                [insertAction](this.element)[0];
        },

        /**
        *  Swaps clone and source elements and displays clone container.
        *  Also sets width to overcome deficiency when element is
        *  instantiated in a non-visible state.
        *  ("0px" width is applied in setupHooter().)
        *
        *  @method stick
        *  @param {HTMLElement} The header or footer item to be stuck.
        */
        stick: function(elem) {
            var settings = this.settings,
                selector = elem.isFooter ? settings.footerSelector : settings.headerSelector,
                width = $(elem).parents('.sticky-hooters_wrapper:first').width() + 'px';

            swapNodes(
                elem,
                elem.stickyClone.querySelector(selector)
            );

            elem.isStuck = true;
            elem.stickyClone.style.display = 'block';
            elem.stickyClone.style.width = width;
        },

        /**
        *  Swaps clone and source back to original location and hides clone container.
        *
        *  @method unstick
        *  @param {HTMLElement} The header or footer item to be unstuck.
        */
        unstick: function(elem) {
            var settings = this.settings,
                selector = elem.isFooter ? settings.footerSelector : settings.headerSelector;

            swapNodes(
                elem,
                this.element.querySelector(selector)
            );

            elem.isStuck = false;
            elem.stickyClone.style.display = 'none';
        },

        /**
        *  If sticky footer is enabled, this method will be called
        *  on scroll to make any required updates to the footer.
        *
        *  @method watchFooter
        *  @param {HTMLElement} The sticky footer item to be processed.
        */
        watchFooter: function(footer) {
            var bodyRect = this.bodyElement.getBoundingClientRect(),
                footAdjust = parseInt(this.settings.bottom, 10),
                footRect = footer.getBoundingClientRect(),
                viewHeight = window.innerHeight;

            if (footer.isStuck) {

                /**
                    Unstick this sticky hooter's footer element if:
                        1. Footer has moved above bottom of viewport, OR ...
                        2. Header has scrolled to the footer, OR ...
                        3. Sticky hooter element is no longer visible in the viewport
                 */
                 if (bodyRect.bottom < viewHeight - footAdjust - footRect.height ||
                     bodyRect.top > viewHeight - footAdjust ||
                     !this.isVisible()) {
                        this.unstick.call(this, footer);
                 }
            } else {

                /**
                    Stick this sticky hooter's footer element if:
                        1. Footer element is below bottom of the viewport, AND ...
                        2. Header is above sticky footer, AND ...
                        3. Sticky hooter element is visible in the viewport
                 */
                if (bodyRect.bottom > viewHeight - footAdjust - footRect.height &&
                    bodyRect.top < viewHeight - footAdjust &&
                    this.isVisible()) {
                        this.stick.call(this, footer);
                }
            }
        },

        /**
        *  If sticky footer is enabled, this method will be called
        *  on scroll to make any required updates to the footer.
        *
        *  @method watchHeader
        *  @param {HTMLElement} The sticky header item to be processed.
        */
        watchHeader: function(header) {
            var bodyRect = this.bodyElement.getBoundingClientRect(),
                headAdjust = parseInt(this.settings.top, 10),
                headRect = header.getBoundingClientRect();

            if (header.isStuck) {

                /**
                    Unstick this sticky hooter's header element if:
                        1. Top of the header is below the top of the sticky header, OR ...
                        2. Footer is under the sticky header
                 */
                if (bodyRect.top > headAdjust + headRect.height ||
                    bodyRect.bottom < headAdjust + headRect.height / 2) {
                        this.unstick.call(this, header);
                }
            } else {

                /**
                    Stick this sticky hooter's header element if:
                        1. Top of the header is at the top of the viewport (or custom position), AND ...
                        2. Footer is below the bottom of the potential sticky header
                 */
                if (bodyRect.top <= headAdjust + headRect.height &&
                    bodyRect.bottom > headAdjust + headRect.height) {
                        this.stick.call(this, header);
                }
            }
        },

        /**
         *  Delegates scroll event handling to specific header
         *  and footer DOM manipulation methods.
         *
         *  @method watchHooters
         *  @parameter {UIEvent} jQuery scroll Event object with injected
         *                       instance reference.
         */
        watchHooters: function(/*event*/) {
            if (!!this.footerElement) {
                this.watchFooter(this.footerElement);
            }

            if (!!this.headerElement) {
                this.watchHeader(this.headerElement);
            }
        },


        /**
         *  Handle any required tear down.
         *   - Remove scroll event handler
         *
         *  @method tearDown
         */
        tearDown: function() {
            window.removeEventListener('scroll', this._scrollHandler);
        }
    });

    /**
        Lightweight wrapper around the constructor,
        preventing multiple instantiations.
    */
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new StickyHooters(this, options));
            }
        });
    };

})(jQuery, window, document);
