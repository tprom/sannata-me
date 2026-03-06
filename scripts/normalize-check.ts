import { handleAgentCommand } from "../components/modules/agent/core/AgentCore";

(async () => {
  const res = await handleAgentCommand(
    "Добавь в галерею достопримечательности Cathedral в городе Augsburg изображения: photo1.jpg, photo2.jpg, photo3.jpg."
  );
  console.log(JSON.stringify(res, null, 2));
})();
