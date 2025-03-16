import Quiz from "@/components/quiz";
import { getUserQuestions } from "../actions/questions";

export default async function Page() {
  const result = await getUserQuestions(10);

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold mb-2">Error loading questions</h2>
        <p className="text-gray-500">{result.error}</p>
      </div>
    );
  }

  if (!result.data || result.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold mb-2">No questions found</h2>
        <p className="text-gray-500">Try generating some questions first</p>
      </div>
    );
  }

  return (
    <Quiz questions={result.data} />
  );
}