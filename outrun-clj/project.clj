(defproject outrun "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "MIT License"
            :url "http://www.opensource.org/licenses/mit-license.php"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [hiccup "1.0.5"]]
  :main ^:skip-aot outrun.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
