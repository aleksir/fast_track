/**
 * A solution for the fast track from Reaktor.
 *
 * http://reaktor.fi/careers/fast_track/
 *
 * @author Aleksi Rautakoski <aleksi.rautakoski@gmail.com>
 */
/*jslint browser: true, nomen: true*/
/*global jQuery, Bacon, _*/
(function (ctx, _) {
    'use strict';
    var __ = {},
        O = {};

    ctx.O = O;
    ctx.O._ = __;

    __.apply = function (fn, pair) {
        return fn.apply(this, pair);
    };

    __.constant = function (x) {
        return x;
    };

    __.map = function (arr, fn) {
        return _.map(fn, arr);
    };

    __.second = function (arr) {
        return arr[1];
    };

    __.split = function (separator, str) {
        return str.split(separator);
    };

    __.words = _.partial(__.split, ' ');
    __.lines = _.partial(__.split, '\n');
    __.parseInt = function (str) {
        return parseInt(str, 10);
    };

    __.zip = function () {
        var args = Array.prototype.slice.call(arguments),
            min = _.min(__.map(_.property('length'), args)),
            result = [],
            i;

        for (i = 0; i < min; i = i + 1) {
            result[i] = __.map(_.property(i), args);
        }
        return result;
    };

    function Route(sum, route) {
        this.sum = sum;
        this.route = route || [sum];
        return this;
    }

    Route.create = function (sum, route) {
        return new Route(sum, route);
    };
    Route.max = function (route1, route2) {
        return route1.sum > route2.sum ? route1 : route2;
    };

    Route.concat = function (route1, route2) {
        var sum = route1.sum + route2.sum,
            route = route1.route.concat(route2.route);
        return Route.create(sum, route);
    };

    O.parseData = function (data) {
        var parseInts = _.partial(__.map, __.parseInt),
            lines = __.lines(data),
            seed = _.head(lines),
            levels = _.tail(lines);
        return [seed, __.map(_.compose(parseInts, __.words), levels)];
    };

    O.parseTreeFromInts = function (tree) {
        // map invokes callback with three arguments (item, value, array)
        // but only first is needed, that's why __.constant
        var createRoute = _.compose(Route.create, __.constant);
        return __.map(_.partial(__.map, createRoute), tree);
    };

    O.findMaxRoute = function (tree) {
        var chooseRoute = _.partial(__.apply, function (x, route1, route2) {
                return Route.concat(x, Route.max(route1, route2));
            }),

            routes = _.foldr(tree, function (routes, nodes) {
                var pairs = __.zip(nodes, routes, _.tail(routes));
                return _.map(pairs, chooseRoute);
            });
        return _.head(routes);
    };

    O.findMaxFromRaw = _.compose(O.findMaxRoute, O.parseTreeFromInts, O.parseData);
}(window, _));


/**
 * Construct a beatiful and interactive tree.
 */
(function ($, Bacon, O, _) {
    $(function () {
        var file = 'tree.txt',
            $tree = $('#tree'),

            parsed = Bacon.fromPromise($.ajax(file))
                        .map(O.parseData),

            seed = parsed.map(_.first),
            
            tree = parsed.map(O._.second)
                        .map(O.parseTreeFromInts),

            elems = tree.map(function (tree) {
                            return _.map(tree, function (level, li) {
                                var $level = $('<div class="row" data-row="' + li + '"></div>');
                                 _.each(level, function (r, i) {
                                     var el = $('<span>', 
                                                {data: {row: li, index: i}, text: _.first(r.route), class: 'item'});
                                     $level.append(el);
                                 });
                                return $level;
                            });
                        }),
            clickedItem,
            selectedItem,
            selectedOrClickedItem,
            selectedTree,
            maxRoute;

        elems.onValue(function (elems) {
            $tree.append(elems);
        });

        tree = tree.zip(elems, function (tree, elems) {
            var uncurry = _.partial(_.partial, O._.apply),
                levelRowPairs = _.zip(tree, elems);

            return _.map(levelRowPairs, uncurry(function (level, row) {
                var routeElemPairs = _.zip(level, row.children());

                return _.map(routeElemPairs, uncurry(function (r, el) {
                    r.route = _.map(r.route, function (i) { return [i, el]; });
                    return r;
                }));
            }));
        });

        function getRowAndIndex($el) { return [$el.data('row'), $el.data('index')]; }

        clickedItem = elems.flatMap(function () { return $tree.find('.item').asEventStream("click"); })
                .doAction('.stopPropagation')
                .map(_.compose($, _.property('target')));

        clickedItem.onValue(function ($item) {
            $tree.find('.clicked').removeClass('clicked');
            $item.addClass('clicked');
            $tree.addClass('clicked');
        });

        $tree.asEventStream("click").onValue(function () {
            $tree.find('.selected, .clicked').removeClass('selected clicked');
            $tree.removeClass('clicked');
        });

        selectedItem = elems.flatMap(function () { return $tree.find('.item').asEventStream("mouseover"); })
                .map(_.compose($, _.property('target')))
                .filter(_.compose(function () { return !$tree.hasClass('clicked'); }));


        selectedOrClickedItem = selectedItem.merge(clickedItem)
                .map(_.partial(getRowAndIndex))
                .toProperty([0,0]);

        selectedTree = tree.combine(selectedOrClickedItem, function (tree, arr) {
                    var row = arr[0],
                        index = arr[1],
                        levels = tree.slice(row);

                    return _.map(levels, function (level, i) {
                        return level.slice(index, index + i + 1);
                    });
                });
        
        maxRoute = selectedTree.map(O.findMaxRoute);

        seed.assign($('#seed'), 'text');

        maxRoute.map(_.property('sum'))
            .map(function (s) { return '# sum: ' + s; })
            .assign($('#sum'), 'text');

        maxRoute.map(_.property('route'))
            .map(_.partial(O._.map, _.property(0)))
            .map(function (s) { return '# route: ' + s; })
            .assign($('#route-text'), 'text');

        maxRoute.map(_.property('route'))
            .map(_.partial(O._.map, _.property(1)))
            .onValue(function (selected) {
                $tree.find('.selected').removeClass('selected');
                _.each(selected, function (sel) { $(sel).addClass('selected'); });
            });

        parsed.onError(function () {
            window.alert('Cannot reach file: ' + file);
        });
    });
}(jQuery, Bacon, window.O, _));
