import { useCallback, useEffect, useMemo, useState } from 'react'
import Masthead from './components/Masthead.jsx'
import BriefBar from './components/BriefBar.jsx'
import StoryItem from './components/StoryItem.jsx'
import Instrument from './components/Instrument.jsx'
import MobileBar from './components/MobileBar.jsx'
import Onboarding from './components/Onboarding.jsx'
import TopicsDialog from './components/TopicsDialog.jsx'
import AboutDialog from './components/AboutDialog.jsx'
import Dialog from './components/Dialog.jsx'
import ViewTabs from './components/ViewTabs.jsx'
import FollowView from './components/FollowView.jsx'
import { FilteredSection, OverflowSection } from './components/Sections.jsx'
import { DemoBanner, EmptyBrief, EmptyFeed, ErrorState, FeedSkeleton } from './components/States.jsx'
import { buildBriefing } from './lib/briefing.js'
import { matchFollows, unreadCount } from './lib/follow.js'
import { useActiveStory, useFeed, useFollows, useNow, usePrefs, useRefresh } from './lib/hooks.js'

const NO_STORIES = []

export default function App() {
  const { status, data, reload } = useFeed()
  const follows = useFollows()
  const [view, setView] = useState('brief') // 'brief' | 'following'
  const [baseline, setBaseline] = useState(null) // the follows as they were when the reader opened the tab
  const [prefs, update] = usePrefs()
  const now = useNow()
  const [panel, setPanel] = useState(null) // 'tune' | 'topics' | 'about'

  useEffect(() => {
    document.documentElement.dataset.heat = prefs.heat
  }, [prefs.heat])

  const stories = data ? data.stories : NO_STORIES
  const topics = data ? data.topics : NO_STORIES
  const leanLabels = data ? data.leanLabels : {}
  const topicLabels = useMemo(() => Object.fromEntries(topics.map(topic => [topic.id, topic.label])), [topics])

  const briefing = useMemo(() => buildBriefing(stories, prefs, now), [stories, prefs, now])
  const activeId = useActiveStory(useMemo(() => briefing.items.map(item => item.story.id), [briefing]))

  const getSnapshot = useCallback(() => new Map(stories.map(story => [story.id, story.updatedAt])), [stories])
  const refresh = useRefresh({ reload, getSnapshot })

  const followedIds = useMemo(() => new Set(follows.marks.map(mark => mark.id)), [follows.marks])
  const liveMatches = useMemo(() => matchFollows(follows.marks, stories, prefs.hidden), [follows.marks, stories, prefs.hidden])
  const unread = view === 'following' ? 0 : unreadCount(liveMatches)
  const shownMatches = useMemo(() => {
    if (view !== 'following') return liveMatches
    const before = new Map((baseline || []).map(mark => [mark.id, mark]))
    return matchFollows(
      follows.marks.map(mark => before.get(mark.id) || mark),
      stories,
      prefs.hidden,
    )
  }, [view, baseline, follows.marks, stories, prefs.hidden, liveMatches])

  // Leaving the tab marks everything as seen; opening it remembers what was unseen so it can be labelled.
  const selectView = next => {
    if (next === view) return
    if (view === 'following') {
      follows.viewed(stories)
      setBaseline(null)
    }
    if (next === 'following') setBaseline(follows.marks)
    setView(next)
  }

  const hide = id => update(previous => ({ hidden: [...previous.hidden, id] }))
  const cardProps = { now, topicLabels, leanLabels, showImages: prefs.images, onHide: hide, followedIds, onFollow: follows.toggle }

  const stats = {
    shown: briefing.items.length,
    total: briefing.items.length + briefing.overflow.length + briefing.filtered.length + briefing.muted.length,
    filtered: briefing.filtered.length,
  }
  const instrument = <Instrument prefs={prefs} update={update} topics={topics} stats={stats} onEditTopics={() => setPanel('topics')} />

  return (
    <div className="min-h-dvh pb-28 lg:pb-16">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        דלג לתוכן
      </a>
      <Masthead generatedAt={data ? data.generatedAt : null} now={now} refresh={refresh} canRefresh onAbout={() => setPanel('about')} />
      {data && data.demo && <DemoBanner />}

      <div className="mx-auto mt-2 grid w-full max-w-[72rem] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-16">
        <main id="main" className="min-w-0">
          {status === 'loading' && <FeedSkeleton />}
          {status === 'error' && <ErrorState onRetry={reload} />}

          {status === 'ready' && stories.length === 0 && <EmptyFeed refresh={refresh} />}

          {status === 'ready' && stories.length > 0 && (
            <>
              <ViewTabs view={view} onChange={selectView} unread={unread} />

              {view === 'following' && (
                <FollowView matches={shownMatches} heat={prefs.heat} now={now} onUnfollow={follows.remove} onBack={() => selectView('brief')} topicLabels={topicLabels} leanLabels={leanLabels} showImages={prefs.images} onHide={hide} followedIds={followedIds} onFollow={follows.toggle} />
              )}

              {view === 'brief' && <BriefBar items={briefing.items} usedSec={briefing.usedSec} budgetSec={briefing.budgetSec} activeId={activeId} />}

              {view === 'brief' && briefing.items.length === 0 ? (
                <EmptyBrief heat={prefs.heat} onShowAll={() => update({ heat: 'all' })} onEditTopics={() => setPanel('topics')} />
              ) : view === 'brief' ? (
                <ol className="mt-6 list-none p-0">
                  {briefing.items.map((entry, index) => (
                    <li key={`${entry.story.id}:${entry.depth}`}>
                      <StoryItem entry={entry} variant={index === 0 ? 'lead' : 'standard'} active={entry.story.id === activeId} {...cardProps} />
                    </li>
                  ))}
                </ol>
              ) : null}

              {view === 'brief' && <OverflowSection entries={briefing.overflow} {...cardProps} />}
              {view === 'brief' && <FilteredSection stories={briefing.filtered} mutedCount={briefing.muted.length} onEditTopics={() => setPanel('topics')} />}
            </>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-6">{instrument}</div>
        </aside>
      </div>

      <MobileBar prefs={prefs} onOpen={() => setPanel('tune')} />

      <Dialog open={panel === 'tune'} onClose={() => setPanel(null)} title="התאמה אישית">
        <div className="[&>section]:bg-transparent [&>section]:p-0">{instrument}</div>
      </Dialog>
      <TopicsDialog open={panel === 'topics'} onClose={() => setPanel(null)} topics={topics} prefs={prefs} update={update} />
      <AboutDialog open={panel === 'about'} onClose={() => setPanel(null)} sources={data ? data.sources : NO_STORIES} leanLabels={leanLabels} />
      <Onboarding open={status === 'ready' && !prefs.onboarded} onDone={() => update({ onboarded: true })} topics={topics} prefs={prefs} update={update} />
    </div>
  )
}
