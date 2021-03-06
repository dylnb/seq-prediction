import Data.List (intersperse, groupBy, sortBy, (\\))
-- import Data.List.Utils (replace)
import Data.Function (on)
import System.IO()
import Text.Printf
import System.Random (randomRIO)
import Control.Monad

-- weird proxy for a subcategorization frame
-- a Cat can unfold into one of several lists of NonTerminals
-- or one of several Terminals
data Cat = NT [[Cat]] | T [String]

-- phrase structure rules for a simple finite state grammar
-- (based on "BROCANTO" from Opitz and Friederici 2004)

-- defines the nonterminals
s, vp, vp', np, pp :: Cat
-- S -> NP VP'
s   = NT [[np, vp']]
-- VP' -> VP | VP PP
vp' = NT [[vp], [vp, pp]]
-- VP -> V | V A | V NP | V A NP
vp  = NT [[v], [v, a], [v, np], [v, a, np]]
-- NP -> D1 N | D2 A N
np  = NT [[d, n], [td, a, n]]
-- PP -> P NP
pp  = NT [[p, np]]

-- defines the terminals (parts of speech)
n, d, td, v, a, p :: Cat
-- N -> "1" | "2"
n  = T ["1", "2"]
-- V -> "3" | "4"
v  = T ["3", "4"]
-- A -> "5" | "6"
a  = T ["5", "6"]
-- P -> "7"
p  = T ["7"]
-- D1 -> "8"
d  = T ["8"]
-- D2 -> "9"
td = T ["9"]

-- practice grammar
ps, pnp, pvp, pap :: Cat
-- S -> NP VP
ps  = NT [[pnp, pvp]]
-- NP -> D N (A) | D A N
pnp = NT [[pd, pn], [pd, pn, pa], [pd, pa, pn]]
-- VP -> V NP | V AP
pvp = NT [[pv, pnp], [pv, pap]]
-- AP -> N A
pap = NT [[pn, pa]]
pd, pn, pa, pv :: Cat
pd = T ["1"]
pn = T ["2"]
pa = T ["3"]
pv = T ["4"]


-- generates all possible subtrees of a category, and returns a list
-- containing the yeilds from all the subtrees
expand :: Cat -> [String]
expand (T  labs ) = labs
expand (NT catss) = catss >>= map concat . mapM expand

-- break sentences into lists of words, and sort the lists by length
org :: [String] -> [[String]]
--org ss = sortBy (compare `on` length) $ filter ((12 >) . length) splits
org = sortBy (compare `on` length) . map words

-- group sentence-lists by length
grp :: [[String]] -> [[[String]]]
grp = groupBy ((==) `on` length)

-- all the grammatical sentences of our FSA; broken into lists of words and
-- sorted by length
fsastims :: [[String]]
fsastims = org $ map (intersperse ' ') $ expand s

practicestims :: [[String]]
practicestims = org $ map (intersperse ' ') $ expand ps

roundToStr :: Int -> Float -> String
roundToStr = printf "%0.*f"

-- choice function
pick :: [a] -> IO a
pick xs = liftM (xs !!) $ randomRIO (0, length xs - 1)

-- chooses an n-size subset of xs
pickN :: Eq a => Int -> [a] -> IO [a]
pickN 1 xs = liftM return $ pick xs
pickN n' xs = do
  x <- pickN 1 xs
  ys <- pickN (n' - 1) (xs \\ x)
  return (x ++ ys)

replaceVs :: String -> IO String
replaceVs ss = do
  let splits = words ss
  let xs = forM splits $ \s' -> if s' `elem` ["1","2"]
                                  then pick [[s',"10"],["10",s']]
                                  else return [s']
  liftM (unwords . concat) xs

replaceNs :: String -> String
replaceNs ss = unwords newsplits
  where splits = words ss
        newsplits = tail $ foldl rep ["-1"] splits
        rep a' b = a' ++ (if b `elem` ["5","6","7","8"] && last a' /= "9"
                            then ["10",b]
                            else [b])

replaceNNs :: String -> IO String
replaceNNs ss = do
  let splits = words ss
  let xs = forM splits $ \s' -> if s' `notElem` ["5","6","7","8"]
                                  then return [s']
                                  else if length splits == 2
                                         then return [s',"10"]
                                         else pick [[s',"10"], [s']]
  liftM (unwords . concat) xs

replaceDs :: String -> String
replaceDs ss = unwords newsplits
  where splits = words ss
        newsplits = [head splits, splits!!1] ++ reps
        reps = do n' <- [2..length splits - 1]
                  let [x,_,z] = [splits!!(n'-2), splits!!(n'-1), splits!!n']
                  return (if x == "9" && z == "10" then "11" else z)

-- collapseNs :: String -> String
-- collapseNs = replace "8" "7" . replace "6" "5"

downshift :: [String] -> [String]
downshift = map (\s' -> if read s' == (6 :: Int) || read s' == (7 :: Int)
                          then show (read s' - (1 :: Int))
                          else if read s' > (8 :: Int)
                                 then show (read s' - (2 :: Int))
                                 else s')

-- main = do
--   let sampsizes = [4, 16, 17, 15, 23, 30, 34, 26, 17, 13]
--   xss <- zipWithM pickN sampsizes (grp fsastims)
--   let stims = concatMap (map unwords) xss
--   writeFile "fsa_grammar.csv" $ unlines ("Sequence":stims)

-- main = do
--   let stims = map unwords practicestims
--   writeFile "practice_grammar.csv" $ unlines ("Sequence":stims)

-- main = do
--   cfg <- readFile "cfg_sixeight-less.csv"
--   let stims = tail . lines $ cfg
--   let cfgstims = map (unwords  . downshift . words) stims
--   writeFile "cfg_grammar.csv" $ unlines ("Sequence":cfgstims)

-- main = do
--   cfg <- readFile "cfg_ds.csv"
--   let stims = tail . lines $ cfg
--   let cfgstims = map collapseNs stims
--   writeFile "cfg_sixeight-less.csv" $ unlines ("Sequence":cfgstims)

-- main = do
--   cfg <- readFile "cfg_nns.csv"
--   let stims = tail . lines $ cfg
--   let cfgstims = map replaceDs stims
--   writeFile "cfg_ds.csv" $ unlines ("Sequence":cfgstims)

-- main = do
--   cfg <- readFile "cfg_rohr_LC.csv"
--   let stims = tail . lines $ cfg
--   cfgstims <- mapM replaceVs stims
--   writeFile "cfg_vs.csv" $ unlines ("Sequence":cfgstims)

-- main = do
--   cfg <- readFile "cfg_rohr_LC.csv"
--   let stims = tail . lines $ cfg
--   let cfgstims = map replaceNs stims
--   writeFile "cfg_ns.csv" $ unlines ("Sequence":cfgstims)

-- main = do
--   cfg <- readFile "cfg_rohr_LC.csv"
--   let stims = tail . lines $ cfg
--   cfgstims <- mapM replaceNNs stims
--   writeFile "cfg_nns.csv" $ unlines ("Sequence":cfgstims) 

main = do
  cfg <- readFile "cfg_grammar.csv"
  let cfgstims = org $ tail . lines $ cfg
  let fsadist = map (\xss -> (length (head xss), fromIntegral (length xss))) $
                    grp fsastims
  let cfgdist = map (\xss -> (length (head xss), fromIntegral (length xss))) $
                    grp cfgstims
  print $ fsadist
  print $ cfgdist
  print $ map (\(i,f) -> (i, roundToStr 2 $ f / fromIntegral (length fsastims))) fsadist 
  print $ map (\(i,f) -> (i, roundToStr 2 $ f / fromIntegral (length cfgstims))) cfgdist
