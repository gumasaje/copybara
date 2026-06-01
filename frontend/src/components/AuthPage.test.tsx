import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./AuthPage";

describe("AuthPage validation", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses browser validation constraints for login credentials", () => {
    render(<AuthPage authMode="login" authError={null} onSubmit={vi.fn()} onToggleMode={vi.fn()} />);

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");

    expect(email).toHaveAttribute("type", "email");
    expect(email).toBeRequired();
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("minLength", "8");
    expect(password).toHaveAttribute("maxLength", "20");
    expect(password).toBeRequired();
  });

  it("uses signup constraints matching backend password and nickname limits", () => {
    render(<AuthPage authMode="signup" authError={null} onSubmit={vi.fn()} onToggleMode={vi.fn()} />);

    const password = screen.getByLabelText("Password");
    const nickname = screen.getByLabelText("Nickname");

    expect(password).toHaveAttribute("minLength", "8");
    expect(password).toHaveAttribute("maxLength", "20");
    expect(nickname).toHaveAttribute("maxLength", "50");
    expect(nickname).toBeRequired();
  });

  it("shows backend validation messages passed from auth session", () => {
    render(<AuthPage authMode="signup" authError="이미 사용 중인 이메일입니다." onSubmit={vi.fn()} onToggleMode={vi.fn()} />);

    expect(screen.getByText("이미 사용 중인 이메일입니다.")).toBeInTheDocument();
  });
});
