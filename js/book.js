var $book, $navigation, $menu;
var $current;
var front_length = 2,
    back_length = 2;
var menu_length = 1,
    post_length = 0;
var pages = front_length + menu_length + post_length + back_length;
var current_page = 1;

jQuery(function($) {
    $book = $('.book');
    $navigation = $(".book-navigation", $book);
    $menu = $("a", $navigation);
    $current = $(".page-current", $book);

    //可能目录页不止一页
    menu_length = $navigation.length;
    //post 数量
    post_length = $menu.length;
    //pages 总数，首页封面 + 目录页 + post 数量 + 末页封面
    pages = front_length + menu_length + post_length + back_length;

    $(".front-cover", $book).addClass("p1");
    $(".front-side", $book).addClass("p2");

    if (pages % 2) {
        //pages 为单数时，末页合不上...
        back_length = 1;
        pages = front_length + menu_length + post_length + back_length;
        $(".back-side", $book).remove();
    } else {
        $(".back-side", $book).addClass("p" + (pages - 1));
    }
    $(".back-cover", $book).addClass("p" + pages);

    $menu.each(function(i) {
        var $item = $(this),
            page = front_length + menu_length + 1 + i;
        /**
         * 目录页定位到实际页码..
         * @see $item -> click
         */
        $item.attr("data-page", page);
        /**
         * 当前页添加页码
         */
        if ($item.data("current") && $current.length) {
            current_page = page;
        }
    }).on("click", function(event) {
        /**
         * 目录页，跳转到指定 post
         * @see $book.turn -> when
         * @see $book.turn -> when: missing
         */
        $book.turn("page", $(this).data("page"));
        return false;
    });

    if ($current.length) {
        //通过 $menu > $item: data("current") 未获取到当前页页码，重新从 $current: data("post") 去获取 $item: data("page")
        if (current_page == 1 && $current.data("post")) {
            var post = $current.data("post");
            current_page = $("[data-post='" + post + "']", $menu).data("page");
        }
        if (current_page <= front_length + menu_length) {
            throw new Error("Cann't get current page. you must define $(\".book-navigation a\") -> data(\"current\") or $(\".page-current\") -> data(\"post\")");
        }
        $current.addClass("p" + current_page);
    } else {
        current_page = 2;
    }

    $book.turn({
        duration: 1000,
        acceleration: false,
        gradients: true,
        autoCenter: true,
        elevation: 50,
        page: current_page,
        pages: pages,
        when: {
            turning: function(event, page, view) {
                var $this = $(this),
                    currentPage = $this.turn('page'),
                    pages = $this.turn('pages');

                if (page > front_length + menu_length && page < pages) {
                    $('.p3', $this).addClass('fixed');
                } else {
                    $('.p3', $this).removeClass('fixed');
                }
                disableControls(page);
            },
            turned: function(event, page, view) {
                var $this = $(this),
                    pages = $this.turn('pages'),
                    $obj = $(".p" + page, $this);
                $this.turn('center');
                if (page == 1) {
                    $this.turn('peel', 'br');
                    window.history.pushState({}, "navigation", "/");
                } else if (page <= front_length + menu_length) {
                    window.history.pushState({}, "navigation", "/");
                } else if (page >= pages) {
                    window.history.pushState({}, "navigation", "/");
                } else {
                    window.history.pushState({
                        post: $obj.data("post")
                    }, $obj.data("title"), $obj.data("url"));
                    $("title").text($obj.data("title"));
                }
                disableControls(page);
            },
            missing: function(event, pages) {
                for (var i = 0; i < pages.length; i++) {
                    addPage(pages[i], $(this));
                }
            }
        }
    });

    // Events for the next button
    $('.next-button').bind($.mouseEvents.over, function() {
        $(this).addClass('next-button-hover');
    }).bind($.mouseEvents.out, function() {
        $(this).removeClass('next-button-hover');
    }).bind($.mouseEvents.down, function() {
        $(this).addClass('next-button-down');
    }).bind($.mouseEvents.up, function() {
        $(this).removeClass('next-button-down');
    }).click(function() {
        $book.turn('next');
    });

    // Events for the next button
    $('.previous-button').bind($.mouseEvents.over, function() {
        $(this).addClass('previous-button-hover');
    }).bind($.mouseEvents.out, function() {
        $(this).removeClass('previous-button-hover');
    }).bind($.mouseEvents.down, function() {
        $(this).addClass('previous-button-down');
    }).bind($.mouseEvents.up, function() {
        $(this).removeClass('previous-button-down');
    }).click(function() {
        $book.turn('previous');
    });

    $book.addClass('animated');
});

$(window).resize(function() {
    resizeViewport();
}).bind('orientationchange', function() {
    resizeViewport();
});

function resizeViewport() {
    var width = $(window).width(),
        height = $(window).height(),
        options = $('.book').turn('options');
    $book.removeClass('animated');
    $('.book-viewport', $book).css({
        width: width,
        height: height
    });
}

function addPage(page, $book) {
    var id, pages = $book.turn('pages');
    console.log(page);
    if (!$book.turn('hasPage', page)) {
        var $element = $("<div>", {
            class: "page"
        }).append($("<div>", {
            class: "gradient"
        }));
        var $loader = $("<div>", {
            class: "loader"
        }).appendTo($element);
        var $content = $("<div>", {
            class: "book-content"
        }).appendTo($element);

        var $item = $(".book-navigation a[data-page=" + page + "]", $book);
        if ($item.length) {
            if ($book.turn('addPage', $element, page)) {
                $.ajax({
                    url: $item.attr("href")
                }).done(function(html) {
                    var $obj = $(".book .page-current", html);
                    $element.data("post", $obj.data("post"));
                    $element.data("title", $obj.data("title"));
                    $element.data("url", $obj.data("url"));
                    $content.replaceWith($(".book-content", $obj));
                    $loader.remove();
                });
            }
        }
    }
}

function disableControls(page) {
    if (page == 1)
        $('.previous-button').hide();
    else
        $('.previous-button').show();

    if (page == $book.turn('pages'))
        $('.next-button').hide();
    else
        $('.next-button').show();
}
