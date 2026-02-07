import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler


# Load trained model
model = joblib.load("model/fraud_model.pkl")


# Load dataset (baseline behavior)
df = pd.read_csv("data/ML.csv")
df['date'] = pd.to_datetime(df['date'], dayfirst=True)


# -------- Feature Builder -------- #

def build_features(df, source, dest, amount):

    temp = df.copy()

    # Add new transaction
    new_row = {
        "typeofaction": "TEST",
        "sourceid": source,
        "destinationid": dest,
        "amountofmoney": amount,
        "date": pd.Timestamp.now(),
        "isfraud": 0,
        "typeoffraud": "None"
    }

    temp = pd.concat([temp, pd.DataFrame([new_row])], ignore_index=True)


    # Recompute sender stats
    sender = temp.groupby('sourceid').agg({
        'amountofmoney': ['count','sum','mean'],
        'destinationid': 'nunique'
    })

    sender.columns = [
        'tx_count','total_sent','avg_amount','unique_receivers'
    ]

    sender.reset_index(inplace=True)


    # Recompute receiver stats
    receiver = temp.groupby('destinationid').agg({
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

    accounts['account'] = (
        accounts['sourceid']
        .fillna(accounts['destinationid'])
        .astype(str)
    )


    # CBI
    scaler = MinMaxScaler()

    accounts['CBI_raw'] = (
        0.25 * accounts['tx_count'] +
        0.30 * accounts['total_sent'] +
        0.20 * accounts['unique_receivers'] +
        0.15 * accounts['unique_senders'] +
        0.10 * accounts['avg_amount']
    )

    accounts['CBI'] = scaler.fit_transform(accounts[['CBI_raw']])


    # Extract source account features
    acc = accounts[accounts['account'] == str(source)]

    if acc.empty:
        return None

    features = [
        'tx_count','total_sent','avg_amount',
        'unique_receivers','unique_senders','CBI'
    ]

    return acc[features]


# -------- User Input -------- #

print("=== Fraud Test Input ===")

source = input("Source ID: ")
dest = input("Destination ID: ")
amount = float(input("Amount: "))


# -------- Prediction -------- #

X_new = build_features(df, source, dest, amount)


if X_new is None:
    print("❌ Account not found")
else:

    prob = model.predict_proba(X_new)[0][1]


    if prob > 0.7:
        risk = "HIGH RISK 🚨"
    elif prob > 0.4:
        risk = "MEDIUM RISK ⚠️"
    else:
        risk = "LOW RISK ✅"


    print("\n=== RESULT ===")
    print(f"Fraud Probability: {prob:.3f}")
    print(f"Risk Level: {risk}")
