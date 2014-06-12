import json
import sqlite3

con = sqlite3.connect('participants.db')
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute('select status, datastring from seq_prediction')

data = []
for row in cur:
  if row['status'] in [3,4,5,7]:
    data.append(row['datastring'])

data = [json.loads(part)['data'] for part in data]

for part in data:
  for record in part:
    record['trialdata']['uniqueid'] = record['uniqueid']

data = [record['trialdata'] for part in data for record in part]

f = open('outs.json', 'w')
f.write(json.dumps(data))
f.close()
