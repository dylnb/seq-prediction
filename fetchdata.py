import json
import sqlite3

con = sqlite3.connect('seq.db')
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute('select status, datastring from seq_prediction')

data = []
for row in cur:
    if row['status'] in [3, 4, 5, 7]:
        data.append(row['datastring'])

# data = [json.loads(part)['data'] for part in data]

d = []
for part in data:
    x = json.loads(part)
    d.append({'data': x['data'],
              'condition': x['condition'],
              'counterbalance': x['counterbalance']})

for part in d:
    for record in part['data']:
        record['trialdata']['uniqueid'] = record['uniqueid']
        record['trialdata']['condition'] = part['condition']
        record['trialdata']['counterbalance'] = part['counterbalance']

d = [record['trialdata'] for part in d for record in part['data']]

out = json.dumps(d).replace('taget', 'target')

f = open('seq.json', 'w')
f.write(out)
f.close()
