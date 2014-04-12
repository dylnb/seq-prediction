import Data.List (intersperse, groupBy, sortBy, maximumBy)
import Data.Function (on)
import System.IO
import Text.Printf
import System.Random (randomRIO)
import Control.Monad

data Cat = NT [[Cat]] | T [String]

-- s, vp, np, cp :: Cat
-- s = NT [[np, vp]]
-- vp = NT [[iv], [tv, np]]
-- np = NT [[d, n], [d, n, cp]]
-- cp = NT [[r, vp]]

-- n, d, r, tv, iv :: Cat
-- n = T ["n"]
-- d = T ["d"]
-- r = T ["r"]
-- tv = T ["tv"]
-- iv = T ["iv"]


s, vp, vp', np, pp :: Cat
s   = NT [[np, vp']]
vp' = NT [[vp], [vp, pp]]
vp  = NT [[v], [v, a], [v, np], [v, a, np]]
np  = NT [[d, n], [td, a, n]]
pp  = NT [[p, np]]

n, d, td, v, a, p :: Cat
n  = T ["1", "2"]
v  = T ["3", "4"]
a  = T ["5", "6"]
p  = T ["7"]
d  = T ["8"]
td = T ["9"]

expand :: Cat -> [String]
expand (T  labs ) = labs
expand (NT catss) = catss >>= map concat . sequence . map expand

org :: [String] -> [[String]]
org ss = sortBy (compare `on` length) $ filter ((12 >) . length) splits
  where splits = map words ss

grp :: [[String]] -> [[[String]]]
grp ss = groupBy ((==) `on` length) ss

fsastims :: [[String]]
fsastims = org $ map (intersperse ' ') $ expand s

roundToStr :: Int -> Float -> String
roundToStr = printf "%0.*f"

pick :: [a] -> IO a
pick xs = randomRIO (0, (length xs - 1)) >>= return . (xs !!)

replaceVs :: String -> IO String
replaceVs ss = do
  let splits = words ss
  let xs = forM splits $ \s -> if s `elem` ["1","2"]
                                 then pick [[s,"10"],["10",s]]
                                 else return [s]
  liftM (unwords . concat) xs

replaceNs :: String -> String
replaceNs ss = unwords newsplits
  where splits = words ss
        newsplits = tail $ foldl rep ["-1"] splits
        rep a b = if b `elem` ["5","6","7","8"] && last a /= "9"
                    then a ++ ["10",b]
                    else a ++ [b]

  
-- main = writeFile "blah.csv" $ unlines ("Sequence":stims)

-- main = do
--   cfg <- readFile "cfg.csv"
--   let cfgstims = tail . lines $ cfg
--   x <- mapM replaceVs cfgstims
--   writeFile "blah_cfg.csv" $ unlines ("Sequence":x)

-- main = do
--   cfg <- readFile "cfg.csv"
--   let cfgstims = tail . lines $ cfg
--   let newcfgstims = map replaceNs cfgstims
--   writeFile "blah_cfg.csv" $ unlines ("Sequence":newcfgstims)


main = do
  cfg <- readFile "blah_cfg.csv"
  let cfgstims = org $ tail . lines $ cfg
  let fsadist = map (\xss -> (length (head xss), fromIntegral (length xss))) $ grp fsastims
  let cfgdist = map (\xss -> (length (head xss), fromIntegral (length xss))) $ grp cfgstims
  print $ take 10 fsastims
  print $ take 10 cfgstims
  print $ maximumBy (compare `on` length) fsastims
  print $ maximumBy (compare `on` length) cfgstims
  print $ fsadist
  print $ cfgdist
  print $ map (\(i,f) -> (i, roundToStr 2 $ f / fromIntegral (length fsastims))) fsadist 
  print $ map (\(i,f) -> (i, roundToStr 2 $ f / fromIntegral (length cfgstims))) cfgdist
