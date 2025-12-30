import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "https://YOUR_RENDER_APP.onrender.com/api";
const COLORS = ["#6366f1", "#22c55e", "#ef4444"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Flowly() {
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [loans, setLoans] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardDue, setCardDue] = useState("");
  const [loanName, setLoanName] = useState("");
  const [emi, setEmi] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    fetch(`${API_URL}/expenses`).then(r => r.json()).then(setExpenses);
    fetch(`${API_URL}/cards`).then(r => r.json()).then(setCards);
    fetch(`${API_URL}/loans`).then(r => r.json()).then(setLoans);
  }, []);

  /* ---------------- ADD ---------------- */
  const addExpense = async () => {
    if (!title || !amount) return;
    const res = await fetch(`${API_URL}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: Number(amount),
        month: new Date().toLocaleString("default", { month: "short" })
      })
    });
    const saved = await res.json();
    setExpenses(p => [saved, ...p]);
    setTitle(""); setAmount("");
  };

  const addCard = async () => {
    const res = await fetch(`${API_URL}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cardName, due: Number(cardDue) })
    });
    const saved = await res.json();
    setCards(p => [saved, ...p]);
    setCardName(""); setCardDue("");
  };

  const addLoan = async () => {
    const res = await fetch(`${API_URL}/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: loanName, emi: Number(emi) })
    });
    const saved = await res.json();
    setLoans(p => [saved, ...p]);
    setLoanName(""); setEmi("");
  };

  /* ---------------- DELETE ---------------- */
  const del = async (type, id, setter) => {
    await fetch(`${API_URL}/${type}/${id}`, { method: "DELETE" });
    setter(p => p.filter(x => x._id !== id));
  };

  /* ---------------- CALCULATIONS ---------------- */
  const expenseTotal = useMemo(() => expenses.reduce((s,e)=>s+e.amount,0), [expenses]);
  const cardTotal = useMemo(() => cards.reduce((s,c)=>s+c.due,0), [cards]);
  const loanTotal = useMemo(() => loans.reduce((s,l)=>s+l.emi,0), [loans]);
  const total = expenseTotal + cardTotal + loanTotal;

  const monthly = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.month] = map[e.month] || [];
      map[e.month].push(e);
    });
    return MONTHS.filter(m => map[m]).map(m => ({
      month: m,
      items: map[m],
      total: map[m].reduce((s,e)=>s+e.amount,0)
    }));
  }, [expenses]);

  /* ---------------- CSV ---------------- */
  const exportCSV = () => {
    const rows = [["Month","Expenses","Cards","Loans","Total"]];
    monthly.forEach(m =>
      rows.push([m.month,m.total,cardTotal,loanTotal,m.total+cardTotal+loanTotal])
    );
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flowly-summary.csv";
    a.click();
  };

  return (
    <div style={{padding:20,fontFamily:"sans-serif"}}>
      <h1>Flowly</h1>
      <button onClick={exportCSV}>Export CSV</button>

      <h2>Total: ₹{total}</h2>

      <h3>Add Expense</h3>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <input type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
      <button onClick={addExpense}>Add</button>

      <h3>Monthly List</h3>
      {monthly.map(m=>(
        <div key={m.month}>
          <h4>{m.month} — ₹{m.total}</h4>
          {m.items.map(e=>(
            <div key={e._id}>
              {e.title} — ₹{e.amount} — {new Date(e.createdAt).toLocaleString()}
              <button onClick={()=>del("expenses",e._id,setExpenses)}>X</button>
            </div>
          ))}
        </div>
      ))}

      <h3>Cards</h3>
      <input placeholder="Name" value={cardName} onChange={e=>setCardName(e.target.value)} />
      <input type="number" placeholder="Due" value={cardDue} onChange={e=>setCardDue(e.target.value)} />
      <button onClick={addCard}>Add</button>
      {cards.map(c=>(
        <div key={c._id}>{c.name} ₹{c.due}
          <button onClick={()=>del("cards",c._id,setCards)}>X</button>
        </div>
      ))}

      <h3>Loans</h3>
      <input placeholder="Name" value={loanName} onChange={e=>setLoanName(e.target.value)} />
      <input type="number" placeholder="EMI" value={emi} onChange={e=>setEmi(e.target.value)} />
      <button onClick={addLoan}>Add</button>
      {loans.map(l=>(
        <div key={l._id}>{l.name} ₹{l.emi}
          <button onClick={()=>del("loans",l._id,setLoans)}>X</button>
        </div>
      ))}

      <h3>Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={[
            {name:"Expenses",value:expenseTotal},
            {name:"Cards",value:cardTotal},
            {name:"Loans",value:loanTotal}
          ]} dataKey="value">
            {COLORS.map((c,i)=><Cell key={i} fill={c} />)}
          </Pie>
          <Tooltip/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
