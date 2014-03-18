-- |
-- ghc -O2 --make -threaded main.hs
-- ./main +RTS -N2
--
module Main where

type Route a = (a, [a])

route x = (x,[x])

maxRoute (a, as) (b, bs)
        | a > b     = (a, as)
        | otherwise = (b, bs)

concatRoute (a, as) (b, bs) = (a + b, as ++ bs)

getRoute :: (Num a, Ord a) => [[a]] -> Route a
getRoute = head . foldr1 fn . map (map route)
    where
        fn xs acc = map choose . zip3 xs acc $ tail acc
        choose (a, b, c) = a `concatRoute` maxRoute b c

main = do
    lines' <- lines `fmap` readFile "tree.txt"
    let ints = map (map read . words) $ tail lines' :: [[Int]]
    putStrLn . show $ getRoute ints
