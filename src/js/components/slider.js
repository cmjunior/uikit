(function(addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-slider", ["uikit"], function(){
            return component || addon(UIkit);
        });
    }

})(function(UI){

    "use strict";

    var dragging, delayIdle;

    UI.component('slider', {

        defaults: {
            centered  : false,
            threshold : 10,
            infinite  : false,
            activecls : 'uk-active'
        },

        boot:  function() {

            // init code
            UI.ready(function(context) {

                setTimeout(function(){

                    UI.$("[data-uk-slider]", context).each(function(){

                        var ele = UI.$(this);

                        if (!ele.data("slider")) {
                            UI.slider(ele, UI.Utils.options(ele.attr('data-uk-slider')));
                        }
                    });

                }, 0);
            });
        },

        init: function() {

            var $this = this;

            this.container = this.element.find('.uk-slider');
            this.focus     = 0;

            UI.$win.on("resize load", UI.Utils.debounce(function() {
                $this.resize(true);
            }, 100));

            this.on("click.uikit.slider", '[data-uk-slider-item]', function(e) {

                e.preventDefault();

                var item = UI.$(this).attr('data-uk-slider-item');

                if ($this.focus == item) return;

                switch(item) {
                    case 'next':
                    case 'previous':
                        $this[item=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.updateFocus(parseInt(slide, 10));
                }
            });

            this.container.on('touchstart mousedown', function(e) {

                delayIdle = function(e) {

                    dragging = $this;

                    if (e.originalEvent && e.originalEvent.touches) {
                        e = e.originalEvent.touches[0];
                    }

                    dragging.element.data({
                        'pointer-start': {x: parseInt(e.pageX, 10), y: parseInt(e.pageY, 10)},
                        'pointer-pos-start': $this.pos
                    });

                    $this.container.addClass('uk-drag');

                    delayIdle = false;
                };

                delayIdle.x         = parseInt(e.pageX, 10);
                delayIdle.threshold = $this.options.threshold;

            });

            this.resize(true);
        },

        resize: function(focus) {

            var $this = this, pos = 0, maxheight = 0, item, width, size;

            this.items = this.container.children();
            this.vp    = this.element[0].getBoundingClientRect().width;

            this.container.css({'min-width': '', 'min-height': ''});

            this.items.each(function(idx){

                item      = UI.$(this);
                size      = item.css({'left': '', 'width':''})[0].getBoundingClientRect();
                width     = size.width;
                maxheight = Math.max(maxheight, size.height);

                item.css({'left': pos, 'width':width}).data({'idx':idx, 'left': pos, 'width': width, 'area': (pos+width), 'center':(pos - ($this.vp/2 - width/2))});

                pos += width;
            });

            this.container.css({'min-width': pos, 'min-height': maxheight});

            this.cw  = pos;
            this.pos = 0;

            this.container.css({
                '-ms-transform': '',
                '-webkit-transform': '',
                'transform': ''
            });

            this.updateFocus(0);
        },

        updatePos: function(pos) {
            this.pos = pos;
            this.container.css({
                '-ms-transform': 'translateX('+pos+'px)',
                '-webkit-transform': 'translateX('+pos+'px)',
                'transform': 'translateX('+pos+'px)'
            });
        },

        updateFocus: function(idx, dir) {

            dir = dir || (idx > this.focus ? 1:-1);

            var $this = this, item = this.items.eq(idx);

            if (this.options.infinite) {
                this.infinite(idx, dir);
            }

            if (this.options.centered) {

                this.updatePos(item.data('center')*-1);

                this.items.filter(this.options.activecls).removeClass(this.options.activecls);
                item.addClass(this.options.activecls);

            } else {

                if (this.options.infinite) {

                    this.updatePos(item.data('left')*-1);

                } else {

                    var area = item.data('width'), i;

                    for (i=idx;i<this.items.length;i++) {
                        area += this.items.eq(i).data('width');
                    }

                    if (area > this.vp) {
                        this.updatePos(item.data('left')*-1);
                    }
                }

            }

            this.focus = idx;
        },

        next: function() {

            var focus = this.items[this.focus + 1] ? (this.focus + 1) : (this.options.infinite ? 0:this.focus);

            this.updateFocus(focus, 1);
        },

        previous: function() {

            var focus = this.items[this.focus - 1] ? (this.focus - 1) : (this.options.infinite ? (this.items[this.focus - 1] ? this.items-1:this.items.length-1):this.focus);

            this.updateFocus(focus, -1);
        },

        infinite: function(baseidx, direction) {

            var $this = this, item = this.items.eq(baseidx), i, z = baseidx, move, lastvisible;

            if (direction == 1) {

                var maxleft = 0;

                for (i=0;i<this.items.length;i++) {

                    if (this.items.eq(z).data('left') > maxleft) {
                        lastvisible = this.items.eq(z);
                        maxleft = lastvisible.data('left');
                    }

                    z = z+1 == this.items.length ? 0:z+1;
                }

                if (lastvisible.data('left') - item.data('left') <= this.vp) {

                    move = this.items.eq(this.items[lastvisible.data('idx') + 1] ? lastvisible.data('idx') + 1 : 0);
                    move.css({'left': lastvisible.data('area')}).data({
                        'left'  : lastvisible.data('area'),
                        'area'  : (lastvisible.data('area')+move.data('width')),
                        'center': (lastvisible.data('area') - (this.vp/2 - move.data('width')/2))
                    });
                }

            } else {

                if (this.options.centered) {

                    var area = 0;

                    move = [];

                    for (i=this.items.length-1;i<this.items.length;i--) {

                        area += this.items.eq(z).data('width');

                        if (z != baseidx) {
                            move.push(this.items.eq(z));
                        }

                        if (area > this.vp/2) {
                            break;
                        }

                        z = z-1 == -1 ? this.items.length-1:z-1;
                    }

                    if (move.length) {

                        move.forEach(function(itm){

                            var left = item.data('left') - itm.data('width');

                            itm.css({'left': left}).data({
                                'left'  : left,
                                'area'  : (left+itm.data('width')),
                                'center': (left - ($this.vp/2 - itm.data('width')/2))
                            });

                            item = itm;
                        });
                    }

                } else {

                    var minleft = 1000000000000000;

                    for (i=0;i<this.items.length;i++) {

                        if (this.items.eq(z).data('left') < minleft) {
                            lastvisible = this.items.eq(z);
                            minleft = lastvisible.data('left');
                        }

                        z = z+1 == this.items.length ? 0:z+1;
                    }

                    if (lastvisible.data('left') - item.data('left') <= 0) {

                        move = this.items.eq(this.items[lastvisible.data('idx') - 1] ? lastvisible.data('idx') - 1 : this.items.length-1);

                        var left = item.data('left') - lastvisible.data('width');

                        move.css({'left': left}).data({
                            'left'  : left,
                            'area'  : (left+move.data('width')),
                            'center': (left - (this.vp/2 - move.data('width')/2))
                        });
                    }
                }
            }
        }
    });

    // handle dragging
    UI.$doc.on('mousemove.uikit.slider touchmove.uikit.slider', function(e) {

        if (e.originalEvent && e.originalEvent.touches) {
            e = e.originalEvent.touches[0];
        }

        if (delayIdle && Math.abs(e.pageX - delayIdle.x) > delayIdle.threshold) {
            delayIdle(e);
        }

        if (!dragging) {
            return;
        }

        var x, xDiff, pos;

        if (e.clientX || e.clientY) {
          x = e.clientX;
        } else if (e.pageX || e.pageY) {
          x = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
        }

        xDiff = x - dragging.element.data('pointer-start').x;

        pos = dragging.element.data('pointer-pos-start') + xDiff;

        dragging.updatePos(pos);
    });

    UI.$doc.on('mouseup.uikit.slider touchend.uikit.slider', function(e) {

        if (dragging) {

            dragging.container.removeClass('uk-drag');
        }

        dragging = delayIdle = false;
    });

    return UI.slider;
});
