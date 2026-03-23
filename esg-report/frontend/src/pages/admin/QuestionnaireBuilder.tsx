import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Eye,
  Leaf,
  Users as UsersIcon,
  Shield,
  Edit
} from 'lucide-react';

type QuestionType = 'single_choice' | 'multi_choice' | 'numeric' | 'scale' | 'text';
type ESGCategory = 'environmental' | 'social' | 'governance';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: ESGCategory;
  weight: number;
  options?: string[];
  required: boolean;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const mockQuestionnaires: Questionnaire[] = [
  {
    id: 'q1',
    title: '2026 ESG Assessment',
    description: 'Comprehensive ESG evaluation for Q1 2026',
    questions: [
      {
        id: 'q1_1',
        text: 'What percentage of your energy comes from renewable sources?',
        type: 'numeric',
        category: 'environmental',
        weight: 10,
        required: true,
      },
      {
        id: 'q1_2',
        text: 'Does your organization have a diversity and inclusion policy?',
        type: 'single_choice',
        category: 'social',
        weight: 8,
        options: ['Yes, implemented', 'In development', 'No'],
        required: true,
      },
    ],
  },
];

export function QuestionnaireBuilder() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>(mockQuestionnaires);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [editMode, setEditMode] = useState(false);

  const categoryColors = {
    environmental: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: Leaf },
    social: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: UsersIcon },
    governance: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Shield },
  };

  const startNewQuestionnaire = () => {
    const newQ: Questionnaire = {
      id: `q${Date.now()}`,
      title: 'New Questionnaire',
      description: '',
      questions: [],
    };
    setSelectedQuestionnaire(newQ);
    setEditMode(true);
  };

  const addQuestion = (category: ESGCategory) => {
    if (!selectedQuestionnaire) return;

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'single_choice',
      category,
      weight: 5,
      options: ['Option 1', 'Option 2'],
      required: true,
    };

    setSelectedQuestionnaire({
      ...selectedQuestionnaire,
      questions: [...selectedQuestionnaire.questions, newQuestion],
    });
  };

  const deleteQuestion = (questionId: string) => {
    if (!selectedQuestionnaire) return;
    setSelectedQuestionnaire({
      ...selectedQuestionnaire,
      questions: selectedQuestionnaire.questions.filter(q => q.id !== questionId),
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!selectedQuestionnaire) return;
    setSelectedQuestionnaire({
      ...selectedQuestionnaire,
      questions: selectedQuestionnaire.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const saveQuestionnaire = () => {
    if (!selectedQuestionnaire) return;
    
    const exists = questionnaires.find(q => q.id === selectedQuestionnaire.id);
    if (exists) {
      setQuestionnaires(questionnaires.map(q => 
        q.id === selectedQuestionnaire.id ? selectedQuestionnaire : q
      ));
    } else {
      setQuestionnaires([...questionnaires, selectedQuestionnaire]);
    }
    setEditMode(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Questionnaire Builder</h1>
        <p className="text-gray-600">Create and manage ESG assessment questionnaires</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questionnaire List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Questionnaires</h2>
              <button
                onClick={startNewQuestionnaire}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {questionnaires.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestionnaire(q);
                    setEditMode(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedQuestionnaire?.id === q.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900 mb-1">{q.title}</p>
                  <p className="text-xs text-gray-600">{q.questions.length} questions</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questionnaire Editor */}
        <div className="lg:col-span-2">
          {selectedQuestionnaire ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          value={selectedQuestionnaire.title}
                          onChange={(e) =>
                            setSelectedQuestionnaire({ ...selectedQuestionnaire, title: e.target.value })
                          }
                          className="w-full text-2xl font-bold text-gray-900 mb-2 border-b-2 border-gray-200 focus:border-blue-500 outline-none"
                          placeholder="Questionnaire Title"
                        />
                        <textarea
                          value={selectedQuestionnaire.description}
                          onChange={(e) =>
                            setSelectedQuestionnaire({ ...selectedQuestionnaire, description: e.target.value })
                          }
                          className="w-full text-gray-600 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Description"
                          rows={2}
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedQuestionnaire.title}
                        </h2>
                        <p className="text-gray-600">{selectedQuestionnaire.description}</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={saveQuestionnaire}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => addQuestion('environmental')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                    >
                      <Leaf className="w-4 h-4" />
                      Add Environmental
                    </button>
                    <button
                      onClick={() => addQuestion('social')}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100"
                    >
                      <UsersIcon className="w-4 h-4" />
                      Add Social
                    </button>
                    <button
                      onClick={() => addQuestion('governance')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <Shield className="w-4 h-4" />
                      Add Governance
                    </button>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {selectedQuestionnaire.questions.map((question, index) => {
                  const colors = categoryColors[question.category];
                  const CategoryIcon = colors.icon;

                  return (
                    <div
                      key={question.id}
                      className={`bg-white rounded-xl border ${colors.border} p-6`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                            <CategoryIcon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            {editMode ? (
                              <input
                                type="text"
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                className="w-full font-medium text-gray-900 border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-1"
                                placeholder="Question text"
                              />
                            ) : (
                              <p className="font-medium text-gray-900">
                                {index + 1}. {question.text}
                              </p>
                            )}
                            <p className={`text-sm ${colors.text} mt-1 capitalize`}>
                              {question.category} • Weight: {question.weight}
                            </p>
                          </div>
                        </div>

                        {editMode && (
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {editMode && (
                        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="single_choice">Single Choice</option>
                              <option value="multi_choice">Multiple Choice</option>
                              <option value="numeric">Numeric</option>
                              <option value="scale">Scale (1-5)</option>
                              <option value="text">Text</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={question.weight}
                              onChange={(e) => updateQuestion(question.id, { weight: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedQuestionnaire.questions.length === 0 && (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <p className="text-gray-600 mb-4">No questions yet</p>
                    {editMode && (
                      <p className="text-sm text-gray-500">
                        Click the buttons above to add questions in different ESG categories
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600">Select a questionnaire to view or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
