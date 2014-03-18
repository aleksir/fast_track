-- |
-- ghc -O2 --make -threaded main.hs
--

module Main where

import Control.Applicative ((<*>))
import Control.Parallel (par, pseq)
import Text.Read (readMaybe)


data Tree a = Node a (Tree a) (Tree a) 
            | Leaf a 
            deriving Show

buildTree :: [[a]] -> Tree a
buildTree = head . buildRows
    where
        buildRows :: [[a]] -> [Tree a]
        buildRows (r:[]) = map Leaf r
        buildRows (r:rs) =  let rs' = buildRows rs
                                leaves = zip rs' $ tail rs' 
                            in  map (uncurry . Node) r <*> leaves

sums :: Num a => Tree a -> [(a,[a])]
sums (Leaf x) = [(x, [x])]
sums (Node x l r) = map (\(y, ys) -> (y+x, x:ys)) (ls `par` rs `pseq` (ls ++ rs))
    where
        ls = sums l
        rs = sums r

maxSum :: Ord a => [(a, [a])] -> (a, [a])
maxSum (x:xs) = foldr fn x xs
    where
        fn (m, ms) (x, xs) 
                | m > x     = (m, ms)
                | otherwise = (x, xs)

main = do
    contents <- readFile "tree.txt"
    let (header:xs) = lines contents
    let ints = map (map read . words) $ xs :: [[Int]]
    let tree = buildTree ints
    let max = maxSum $ sums tree
    putStrLn $ show max
    writeFile "max.txt" $ show max
