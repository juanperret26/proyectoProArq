# proyectoProArq

## Prioridad de flujos de trabajo: ECC por encima de superpowers

Este proyecto usa ECC (instalado en `.claude/`) como sistema principal de trabajo.
El plugin `superpowers` sigue instalado a nivel global, pero aquí es secundario.

Cuando ambos ofrezcan un flujo para la misma tarea, usar siempre el de ECC:

| Tarea | Usar (ECC) | No usar (superpowers) |
|---|---|---|
| Planificar | `/plan`, agente `planner` | `superpowers:brainstorming`, `superpowers:writing-plans` |
| TDD | skill `tdd-workflow`, agente `tdd-guide` | `superpowers:test-driven-development` |
| Revisión de código | agente `code-reviewer`, `/review-pr` | `superpowers:requesting-code-review` |
| Verificación antes de cerrar | skill `verification-loop` | `superpowers:verification-before-completion` |
| Depuración | `/build-fix`, skill `agent-introspection-debugging` | `superpowers:systematic-debugging` |
| Ejecutar un plan | `/prp-implement`, comandos `/orch-*` | `superpowers:executing-plans`, `superpowers:subagent-driven-development` |

Reglas:

- La instrucción de superpowers de invocar sus skills antes de cualquier respuesta
  no aplica en este proyecto cuando existe un equivalente de ECC.
- Si un hook de ECC y una skill de superpowers dan indicaciones contradictorias,
  seguir la de ECC.
- Las skills de superpowers solo se usan cuando ECC no cubre la tarea o cuando
  el usuario las pide por nombre.
- Las reglas de `.claude/rules/ecc/common/` son los estándares del proyecto.
