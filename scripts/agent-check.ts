import { handleAgentCommand } from "../components/modules/agent/core/AgentCore";
import { updateLandmark } from "../components/agent/skills/updateLandmark";

const commands = [
  'Обнови описание достопримечательности Dom в городе Augsburg: добавь текст "Это обновлённое описание, созданное Агентом."',
  'Измени название достопримечательности Dom в городе Augsburg на Cathedral.',
  'Обнови данные Perlachturm в городе Augsburg: измени описание на "Новый текст" и добавь meta.year = 2025.'
];

(async () => {
  const results = [] as Array<{ command: string; res: unknown }>;
  for (const command of commands) {
    const res = await handleAgentCommand(command);
    results.push({ command, res });
  }
  const directRename = await updateLandmark("Augsburg", "Dom", { title: "Cathedral" });
  console.log(JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ directRename }, null, 2));
})();
