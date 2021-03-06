;; "Hello World!" 
;; This is my first clojure app ever. :)
;; Going to fall in love with this language.

(ns ^{:doc "Find route through the map of Out Run."
      :author "Aleksi Rautakoski"} outrun.core
  (:gen-class)
  (:use [clojure.string :only (split split-lines)]
        hiccup.core hiccup.element hiccup.page)
  (:require [clojure.java.io :as io]))

(defrecord Route [sum route])

(defn create-route
  "Makes Route from a number."
  [number]
  (Route. number [number]))

(defn route-max 
  [& routes] 
  (reduce 
    (fn [route1 route2]
      (if (> (:sum route1) (:sum route2)) route1 route2)) 
    routes))

(defn route-concat
  "Concats two or more routes into a one."
  [& routes]
  (reduce (fn [route1 route2]
            (Route. 
              (+ (:sum route1) (:sum route2))
              (concat (:route route1) (:route route2))))
          routes))

(defn pairs
  "Makes pairs of next and previous items."
  [list]
  (map vector list (rest list)))

(defn find-max-route 
  "Finds the most popular route from the tree."
  [tree]
  (->> 
    (reverse tree) 
    (reduce 
      (fn [previous row]
        (->>
          (pairs previous)
          (map (partial apply route-max))
          (map route-concat row))))
    first))

(defn parse-tree
  "Parse tree data from a file."
  [file]
  (let 
    [content (slurp file)
    [seed lines] (split-at 1 (split-lines content))]
    [seed (map (fn [line] (->>
                  (split line #"\s")
                  (map (comp create-route #(Integer/parseInt %)))))
               lines)]))



;; This must be used before find-max-route if you want to generate html
(defn add-indexes-into-tree
  "Adds indexes into a tree."
  [tree]
  (map-indexed 
    (fn [level-i level] 
      (map-indexed 
        (fn [route-i route]
          (->> [(concat (:route route) [level-i route-i])]
            (assoc route :route)))
        level)) 
    tree))

;; Generate html
(defn route-in-html
  "Prints route in pretty html format."
  [seed route tree]
  (let [r (atom (:route route))]
    (html5
      [:head 
       [:style (concat ".tree { width: " (str (* 1.6 (count (:route route)))) "rem; }\n")
               ".tree, .tree .item {font-size: 1rem; font-family: monospace; text-align: center; }\n"
               ".tree .item { display: inline-block; width: 1.6rem; }\n"
               ".tree .item.selected { font-weight: bold; color: red; }"]]
      [:body
       [:h1 seed]
       [:h2 (str "# sum: "(:sum route))]
       [:div.tree 
        (for [level tree]  
          [:div 
           (for [item level] 
             (let [[x i l]    (first (:route item))
                   [rx ri rl] (first @r)] 
                  (if (and (= i ri) (= l rl)) 
                    (do
                      (swap! r rest)
                      [:span.item.selected x])
                    [:span.item x])))])]])))

(defn -main
  "Main"
  [file & args]
  (let
    [[seed tree] (parse-tree file)
     indexed-tree (add-indexes-into-tree tree)
     route (find-max-route indexed-tree)
     html (route-in-html seed route indexed-tree)]
    (print html)))
