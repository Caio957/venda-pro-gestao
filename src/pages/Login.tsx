import React, { useState } from "react";
import { login, cadastrar } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isCadastro, setIsCadastro] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      if (isCadastro) {
        await cadastrar(email, senha);
        alert("Cadastro realizado! Faça login.");
        setIsCadastro(false);
      } else {
        await login(email, senha);
        alert("Login realizado!");
        // Redirecione para a página principal
      }
    } catch (err: any) {
      setErro(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "auto", marginTop: 40 }}>
      <h2>{isCadastro ? "Cadastro" : "Login"}</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={e => setSenha(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      {erro && <div style={{ color: "red", marginBottom: 8 }}>{erro}</div>}
      <button type="submit" style={{ width: "100%", marginBottom: 8 }}>
        {isCadastro ? "Cadastrar" : "Entrar"}
      </button>
      <button type="button" onClick={() => setIsCadastro(!isCadastro)} style={{ width: "100%" }}>
        {isCadastro ? "Já tenho conta" : "Criar nova conta"}
      </button>
    </form>
  );
} 