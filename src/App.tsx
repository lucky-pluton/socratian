import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  addJournalEntry,
  fetchCurriculum,
  fetchState,
  getStudentId,
  resetJourney,
  sendTutorTurn,
  switchStage,
} from './api/client';
import { CelebrationBanner } from './components/CelebrationBanner';
import { Layout, type NavTab } from './components/Layout';
import { ConceptMap } from './pages/ConceptMap';
import { HomeDashboard } from './pages/HomeDashboard';
import { PracticeLab } from './pages/PracticeLab';
import { ProgressDashboard } from './pages/ProgressDashboard';
import { ReflectionJournal } from './pages/ReflectionJournal';
import { SocraticRoom } from './pages/SocraticRoom';
import type {
  BadgeDefinition,
  ChallengeItem,
  ConceptDefinition,
  JournalEntry,
  SequentialQuestion,
  StageDefinition,
  StageId,
  StudentState,
} from './types/socratic';

export const App: React.FC = () => {
  const [studentId] = useState<string>(() => getStudentId());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [stages, setStages] = useState<StageDefinition[]>([]);
  const [concepts, setConcepts] = useState<ConceptDefinition[]>([]);
  const [questions, setQuestions] = useState<SequentialQuestion[]>([]);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [state, setState] = useState<StudentState | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<ChallengeItem | null>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<ChallengeItem | null>(null);
  const [activeChallengeKind, setActiveChallengeKind] = useState<'daily' | 'weekly' | undefined>(
    undefined
  );

  const [bootError, setBootError] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [celebratedConcepts, setCelebratedConcepts] = useState<ConceptDefinition[]>([]);
  const [celebratedBadges, setCelebratedBadges] = useState<BadgeDefinition[]>([]);
  const turnInFlightRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      setBootError(null);
      const [curr, st] = await Promise.all([
        fetchCurriculum(),
        fetchState(studentId),
      ]);
      setStages(curr.stages);
      setConcepts(curr.concepts);
      setQuestions(curr.questions);
      setBadges(curr.badges);
      setState(st.state);
      setDailyChallenge(st.dailyChallenge);
      setWeeklyChallenge(st.weeklyChallenge);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Unable to connect to server');
    }
  }, [studentId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSelectStage = async (stageId: StageId) => {
    if (!state) return;
    setActiveChallengeKind(undefined);
    setTutorError(null);
    const res = await switchStage(studentId, stageId);
    setState(res.state);
    setActiveTab('room');
  };

  const handleStartChallenge = async (challenge: ChallengeItem) => {
    if (!state) return;
    setActiveTab('room');
    setTutorLoading(true);
    setTutorError(null);
    setActiveChallengeKind(challenge.kind);
    try {
      const res = await sendTutorTurn({
        studentId,
        stageId: challenge.stageId,
        message: challenge.title,
        action: 'challenge_start',
        challengePrompt: challenge.prompt,
        challengeKind: challenge.kind,
      });
      setState(res.state);
    } catch (err) {
      setTutorError(err instanceof Error ? err.message : 'Failed to start challenge');
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSendTurn = async (
    message: string,
    action: 'answer' | 'ask_why' | 'hint' | 'simplify' = 'answer'
  ): Promise<boolean> => {
    if (!state || turnInFlightRef.current) return false;
    turnInFlightRef.current = true;
    setTutorLoading(true);
    setTutorError(null);
    const clientTurnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = await sendTutorTurn({
        studentId,
        stageId: state.currentStageId,
        message,
        action,
        challengeKind: activeChallengeKind,
        clientTurnId,
      });
      setState(res.state);
      if (res.newlyDiscoveredConcepts.length > 0 || res.newlyEarnedBadges.length > 0) {
        setCelebratedConcepts(res.newlyDiscoveredConcepts);
        setCelebratedBadges(res.newlyEarnedBadges);
      }
      if (activeChallengeKind === 'daily' && res.state.dailyChallengeCompletedDate) {
        setDailyChallenge((d) => (d ? { ...d, completed: true } : d));
      }
      if (activeChallengeKind === 'weekly' && res.state.weeklyChallengeCompleted) {
        setWeeklyChallenge((w) => (w ? { ...w, completed: true } : w));
      }
      return true;
    } catch (err) {
      setTutorError(err instanceof Error ? err.message : 'Tutor request failed');
      return false;
    } finally {
      turnInFlightRef.current = false;
      setTutorLoading(false);
    }
  };

  const handleSaveToJournal = async (payload: {
    stageId: StageId;
    conceptId: string | null;
    entryType: JournalEntry['entryType'];
    title: string;
    content: string;
  }) => {
    const res = await addJournalEntry({
      studentId,
      ...payload,
    });
    setState(res.state);
  };

  const handleReset = async () => {
    const res = await resetJourney(studentId);
    setState(res.state);
    setDailyChallenge(res.dailyChallenge);
    setWeeklyChallenge(res.weeklyChallenge);
    setCelebratedConcepts([]);
    setCelebratedBadges([]);
    setActiveTab('home');
  };

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF7F2]">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm space-y-3">
          <h1 className="font-display text-xl font-bold text-stone-900">
            Could Not Reach Socratia Server
          </h1>
          <p className="text-sm text-stone-600">{bootError}</p>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state || !dailyChallenge || !weeklyChallenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FAF7F2]">
        <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
        <span className="text-sm font-medium text-stone-600">
          Preparing your Socratic Learning Studio...
        </span>
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      state={state}
      onReset={() => void handleReset()}
    >
      <CelebrationBanner
        concepts={celebratedConcepts}
        badges={celebratedBadges}
        onDismiss={() => {
          setCelebratedConcepts([]);
          setCelebratedBadges([]);
        }}
      />

      {activeTab === 'home' && (
        <HomeDashboard
          state={state}
          stages={stages}
          concepts={concepts}
          dailyChallenge={dailyChallenge}
          weeklyChallenge={weeklyChallenge}
          onContinueLearning={(sid) => {
            if (sid && sid !== state.currentStageId) {
              void handleSelectStage(sid);
            } else {
              setActiveTab('room');
            }
          }}
          onStartChallenge={(c) => void handleStartChallenge(c)}
          onOpenMap={() => setActiveTab('map')}
        />
      )}

      {activeTab === 'room' && (
        <SocraticRoom
          state={state}
          stages={stages}
          concepts={concepts}
          questions={questions}
          loading={tutorLoading}
          error={tutorError}
          onSelectStage={(sid) => void handleSelectStage(sid)}
          onSendTurn={handleSendTurn}
          onPauseToHome={() => setActiveTab('home')}
          onSaveToJournal={async (title, content) => {
            await handleSaveToJournal({
              stageId: state.currentStageId,
              conceptId: null,
              entryType: 'reflection',
              title,
              content,
            });
          }}
        />
      )}

      {activeTab === 'map' && (
        <ConceptMap
          state={state}
          stages={stages}
          concepts={concepts}
          onExploreStage={(sid) => void handleSelectStage(sid)}
        />
      )}

      {activeTab === 'lab' && <PracticeLab />}

      {activeTab === 'journal' && (
        <ReflectionJournal
          state={state}
          stages={stages}
          concepts={concepts}
          onAddEntry={handleSaveToJournal}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressDashboard
          state={state}
          stages={stages}
          concepts={concepts}
          badges={badges}
        />
      )}
    </Layout>
  );
};

export default App;
