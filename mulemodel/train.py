import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler


# Load data
df = pd.read_csv("data/ML.csv")
df['date'] = pd.to_datetime(df['date'], dayfirst=True)

df['typeofaction'] = df['typeofaction'].astype('category').cat.codes


# -------- Feature Engineering -------- #

# Sender stats
sender = df.groupby('sourceid').agg({
    'amountofmoney': ['count','sum','mean'],
    'destinationid': 'nunique'
})

sender.columns = [
    'tx_count','total_sent','avg_amount','unique_receivers'
]

sender.reset_index(inplace=True)


# Receiver stats
receiver = df.groupby('destinationid').agg({
    'amountofmoney': ['count','sum'],
    'sourceid': 'nunique'
})

receiver.columns = [
    'rx_count','total_received','unique_senders'
]

receiver.reset_index(inplace=True)


# Merge
accounts = pd.merge(
    sender,
    receiver,
    left_on='sourceid',
    right_on='destinationid',
    how='outer'
)

accounts.fillna(0, inplace=True)

accounts['account'] = accounts['sourceid'].fillna(accounts['destinationid'])
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


# -------- Labels -------- #

fraud_map = df.groupby('sourceid')['isfraud'].max()

accounts['isFraud'] = accounts['account'].map(fraud_map)
accounts['isFraud'] = accounts['isFraud'].fillna(0)


# -------- ML -------- #

features = [
    'tx_count','total_sent','avg_amount',
    'unique_receivers','unique_senders','CBI'
]

X = accounts[features]
y = accounts['isFraud']


X_train, X_test, y_train, y_test = train_test_split(
    X,y,test_size=0.2,
    random_state=42,
    stratify=y
)


model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train,y_train)


# -------- Save -------- #

joblib.dump(model,"model/fraud_model.pkl")

print("✅ Model trained and saved!")
