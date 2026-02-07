import pandas as pd
import joblib
import networkx as nx
from pyvis.network import Network
from sklearn.preprocessing import MinMaxScaler


# Load data
df = pd.read_csv("data/ML.csv")
df['date'] = pd.to_datetime(df['date'], dayfirst=True)

df['typeofaction'] = df['typeofaction'].astype('category').cat.codes


# -------- Feature Engineering -------- #

sender = df.groupby('sourceid').agg({
    'amountofmoney': ['count','sum','mean'],
    'destinationid': 'nunique'
})

sender.columns = [
    'tx_count','total_sent','avg_amount','unique_receivers'
]

sender.reset_index(inplace=True)


receiver = df.groupby('destinationid').agg({
    'amountofmoney': ['count','sum'],
    'sourceid': 'nunique'
})

receiver.columns = [
    'rx_count','total_received','unique_senders'
]

receiver.reset_index(inplace=True)


accounts = pd.merge(
    sender,
    receiver,
    left_on='sourceid',
    right_on='destinationid',
    how='outer'
)

accounts.fillna(0, inplace=True)

accounts['account'] = (
    accounts['sourceid']
    .fillna(accounts['destinationid'])
    .astype(str)
)
accounts = accounts[accounts['account'] != 'nan']


accounts.drop(['sourceid','destinationid'], axis=1, inplace=True)


# -------- CBI -------- #

scaler = MinMaxScaler()

accounts['CBI_raw'] = (
    0.25 * accounts['tx_count'] +
    0.30 * accounts['total_sent'] +
    0.20 * accounts['unique_receivers'] +
    0.15 * accounts['unique_senders'] +
    0.10 * accounts['avg_amount']
)

accounts['CBI'] = scaler.fit_transform(accounts[['CBI_raw']])


# -------- Load Model -------- #

model = joblib.load("model/fraud_model.pkl")


# -------- Predict -------- #

features = [
    'tx_count','total_sent','avg_amount',
    'unique_receivers','unique_senders','CBI'
]

accounts['fraud_prob'] = model.predict_proba(
    accounts[features]
)[:,1]


def Risk(p):
    if p>0.7: return "High"
    if p>0.4: return "Medium"
    return "Low"


accounts['Risk'] = accounts['fraud_prob'].apply(Risk)


# -------- Build Graph -------- #

import networkx as nx
from pyvis.network import Network

G = nx.DiGraph()


# Add Nodes
for _, row in accounts.iterrows():

    try:
        node_id_str = str(int(float(row['account'])))
    except:
        continue   # skip bad rows

    G.add_node(
        node_id_str,
        CBI=round(row['CBI'],3),
        risk=row['Risk'],
        fraud_prob=round(row['fraud_prob'],3)
    )


# Add Edges
for _, row in df.iterrows():

    G.add_edge(
        str(row['sourceid']),
        str(row['destinationid']),
        amount=row['amountofmoney'],
        date=str(row['date']),
        fraud=row['isfraud']
    )


# -------- Visualization -------- #

net = Network(
    height="800px",
    width="100%",
    directed=True,
    bgcolor="#0f172a",
    font_color="white"
)


# Add Nodes to PyVis
for node, data in G.nodes(data=True):

    risk_val = data.get('risk', 'Unknown')
    cbi_val = data.get('CBI', 'N/A')
    fraud_prob_val = data.get('fraud_prob', 'N/A')

    color = "green"

    if risk_val == "Medium":
        color = "orange"
    elif risk_val == "High":
        color = "red"
    elif risk_val == "Unknown":
        color = "grey"

    net.add_node(
        str(node),
        label=str(node),
        color=color,
        title=f"""
        CBI: {cbi_val}
        Risk: {risk_val}
        FraudProb: {fraud_prob_val}
        """
    )


# Add Edges to PyVis
for u, v, data in G.edges(data=True):

    net.add_edge(
        str(u),
        str(v),
        title=f"""
        Amount: {data['amount']}
        Date: {data['date']}
        Fraud: {data['fraud']}
        """
    )


# Save
net.write_html("fraud_network.html")

print("✅ Graph generated!")
