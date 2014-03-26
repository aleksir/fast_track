-- |
-- ghc -O2 --make -threaded main.hs
-- ./main +RTS -N2
--
module Main where

import System.Environment (getArgs)

type Route a = (a, [a])

mkRoute x = (x, [x])

maxRoute (a, as) (b, bs) = if a > b then (a, as) else (b, bs)

concatRoute (a, as) (b, bs) = (a + b, as ++ bs)

getRoute :: (Num a, Ord a) => [[Route a]] -> Route a
getRoute = head . foldr1 reduce
    where
        reduce xs acc = map choose . zip3 xs acc $ tail acc
        choose (a, b, c) = a `concatRoute` maxRoute b c

parseTree :: [String] -> [[Route Int]]
parseTree = map (map (mkRoute . read) . words)

main = do
    (file:_) <- getArgs
    (seed:levels) <- lines `fmap` readFile file
    
    let tree = parseTree levels
    let (sum, route) = getRoute tree
    
    putStrLn seed
    putStrLn . (++) "# sum: " . show $ sum
    putStrLn . (++) "# route: " . unwords $ map show route
