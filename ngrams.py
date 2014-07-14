import csv
from collections import defaultdict
import itertools

bgs = defaultdict(lambda: defaultdict(int))
tgs = defaultdict(lambda: defaultdict(int))
with open('fsa_ngrams.csv', 'r') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    reader.next()
    for wholerow in reader:
        userow = wholerow[2:]
        if userow[1] != 'NA':
            bgs[userow[0]][userow[1]] += 1
            if userow[2] != 'NA':
                tgs[(userow[0], userow[1])][userow[2]] += 1

    print bgs
    print tgs[('8','1')]

    reader = csv.reader(csvfile, delimiter=',')
    reader.next()
    for wholerow in reader:
        userow = wholerow[2:]
        if userow[2] != 'NA':




