import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoResumo, CredenciaisLogin } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { AgendamentoService } from '../../core/services/agendamento.service';
import { AuthService } from '../../core/auth/auth.service';
import { dataCurta } from '../../core/util/formatos';
import { Erro } from '../../shared/estados/erro';
import { Vazio } from '../../shared/estados/vazio';
import { LoginCartao } from '../../shared/login-cartao/login-cartao';
import { Skeleton } from '../../shared/skeleton/skeleton';

@Component({
  selector: 'app-meus-agendamentos',
  imports: [Erro, Vazio, LoginCartao, Skeleton],
  templateUrl: './meus-agendamentos.html',
  styleUrl: './meus-agendamentos.css',
})
export class MeusAgendamentos implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly logado = this.auth.logado;
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroLogin = signal<string | null>(null);
  readonly ocupado = signal(false);
  readonly agendamentos = signal<AgendamentoResumo[]>([]);

  readonly ordenados = computed(() =>
    [...this.agendamentos()].sort((a, b) =>
      `${b.dataAgendamento}${b.horaInicio}`.localeCompare(`${a.dataAgendamento}${a.horaInicio}`),
    ),
  );

  ngOnInit(): void {
    if (this.logado()) {
      this.carregar();
    }
  }

  entrar(credenciais: CredenciaisLogin): void {
    this.ocupado.set(true);
    this.erroLogin.set(null);

    this.auth
      .login(credenciais)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ocupado.set(false);
          this.carregar();
        },
        error: (erro: unknown) => {
          this.ocupado.set(false);
          this.erroLogin.set(mensagemDeErro(erro));
        },
      });
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.agendamentoService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.agendamentos.set(lista);
          this.carregando.set(false);
        },
        error: (erro: unknown) => {
          this.agendamentos.set([]);
          this.carregando.set(false);
          this.erro.set(mensagemDeErro(erro));
        },
      });
  }

  agendarSala(): void {
    void this.router.navigate(['/agendamento']);
  }

  rotuloData(iso: string): string {
    return dataCurta(iso);
  }

  horaCurta(hora: string): string {
    return hora.slice(0, 5);
  }

  rotuloStatus(status: string): string {
    const texto = status.replaceAll('_', ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  chaveStatus(status: string): string {
    if (status === 'ERRO') {
      return 'erro';
    }

    return status === 'CONFIRMADO' ? 'confirmado' : 'outro';
  }

  pista(item: AgendamentoResumo): string {
    return `${item.dataAgendamento}|${item.horaInicio}|${item.salaId.id}`;
  }
}
