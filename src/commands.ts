import { api, formatMoney, type Money } from "./api.ts";

interface Account {
  accountUid: string;
  accountType: string;
  defaultCategory: string;
  currency: string;
  createdAt: string;
  name: string;
}

interface Balance {
  clearedBalance: Money;
  effectiveBalance: Money;
  pendingTransactions: Money;
  amount: Money;
}

interface FeedItem {
  feedItemUid: string;
  categoryUid: string;
  amount: Money;
  direction: string;
  transactionTime: string;
  counterPartyName: string;
  reference: string;
  status: string;
  spendingCategory: string;
}

interface Payee {
  payeeUid: string;
  payeeName: string;
  payeeType: string;
  accounts: { accountIdentifier: string; bankIdentifier: string }[];
}

interface StandingOrder {
  paymentOrderUid: string;
  amount: Money;
  reference: string;
  payeeUid: string;
  payeeName: string;
  standingOrderRecurrence: {
    frequency: string;
    startDate: string;
    count?: number;
  };
  cancelledAt?: string;
}

interface DirectDebit {
  uid: string;
  reference: string;
  status: string;
  originatorName: string;
  originatorUid: string;
  lastDate?: string;
  lastAmount?: Money;
}

// --- Queries ---

export async function accounts(token: string) {
  const res = await api<{ accounts: Account[] }>({ token, path: "/accounts" });
  return res.accounts;
}

export async function balance(token: string) {
  const accts = await accounts(token);
  const primary = accts.find((a) => a.accountType === "PRIMARY");
  if (!primary) throw new Error("No primary account found");
  const bal = await api<Balance>({
    token,
    path: `/accounts/${primary.accountUid}/balance`,
  });
  return {
    accountUid: primary.accountUid,
    accountName: primary.name,
    balance: formatMoney(bal.effectiveBalance),
    balanceMinorUnits: bal.effectiveBalance.minorUnits,
    currency: bal.effectiveBalance.currency,
    pending: formatMoney(bal.pendingTransactions),
    pendingMinorUnits: bal.pendingTransactions.minorUnits,
  };
}

export async function allBalances(tokens: { name: string; token: string }[]) {
  const results = [];
  for (const { name, token } of tokens) {
    try {
      const bal = await balance(token);
      results.push({ account: name, ...bal });
    } catch (err) {
      results.push({
        account: name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

export async function transactions(
  token: string,
  options: { since?: string; limit?: number } = {},
) {
  const accts = await accounts(token);
  const primary = accts.find((a) => a.accountType === "PRIMARY");
  if (!primary) throw new Error("No primary account found");

  const since =
    options.since ?? new Date(Date.now() - 7 * 86400000).toISOString();

  const res = await api<{ feedItems: FeedItem[] }>({
    token,
    path: `/feed/account/${primary.accountUid}/category/${primary.defaultCategory}?changesSince=${since}`,
  });

  const items = res.feedItems.map((item) => ({
    id: item.feedItemUid,
    direction: item.direction,
    amount: formatMoney(item.amount),
    amountMinorUnits: item.amount.minorUnits,
    counterParty: item.counterPartyName,
    reference: item.reference || null,
    date: item.transactionTime,
    status: item.status,
    category: item.spendingCategory,
  }));

  return options.limit ? items.slice(0, options.limit) : items;
}

export async function payees(token: string) {
  const res = await api<{ payees: Payee[] }>({ token, path: "/payees" });
  return res.payees.map((p) => ({
    id: p.payeeUid,
    name: p.payeeName,
    type: p.payeeType,
  }));
}

export async function standingOrders(token: string) {
  const accts = await accounts(token);
  const primary = accts.find((a) => a.accountType === "PRIMARY");
  if (!primary) throw new Error("No primary account found");

  const res = await api<{ standingOrders: StandingOrder[] }>({
    token,
    path: `/payments/local/account/${primary.accountUid}/category/${primary.defaultCategory}/standing-orders`,
  });

  return res.standingOrders.map((so) => ({
    id: so.paymentOrderUid,
    payee: so.payeeName,
    amount: formatMoney(so.amount),
    amountMinorUnits: so.amount.minorUnits,
    reference: so.reference,
    frequency: so.standingOrderRecurrence.frequency,
    startDate: so.standingOrderRecurrence.startDate,
    cancelled: so.cancelledAt ?? null,
  }));
}

export async function directDebits(token: string) {
  const res = await api<{ mandates: DirectDebit[] }>({
    token,
    path: "/direct-debit/mandates",
  });

  return res.mandates.map((dd) => ({
    id: dd.uid,
    originator: dd.originatorName,
    reference: dd.reference,
    status: dd.status,
    lastDate: dd.lastDate ?? null,
    lastAmount: dd.lastAmount ? formatMoney(dd.lastAmount) : null,
  }));
}

export async function savingsGoals(token: string) {
  const accts = await accounts(token);
  const primary = accts.find((a) => a.accountType === "PRIMARY");
  if (!primary) throw new Error("No primary account found");

  const res = await api<{
    savingsGoalList: {
      savingsGoalUid: string;
      name: string;
      target: Money;
      totalSaved: Money;
      savedPercentage: number;
      state: string;
    }[];
  }>({
    token,
    path: `/account/${primary.accountUid}/savings-goals`,
  });

  return res.savingsGoalList.map((sg) => ({
    id: sg.savingsGoalUid,
    name: sg.name,
    target: formatMoney(sg.target),
    saved: formatMoney(sg.totalSaved),
    percentage: sg.savedPercentage,
    state: sg.state,
  }));
}
