import React, { useEffect, useRef, useState } from "react";

export interface HealTool {
  id: number; title: string; desc: string; icon: string;
  duration: string; type: string; gradient: [string, string];
}

// ─── Breathing Configs ────────────────────────────────────────────────────────

interface BPhase { label: string; sub: string; dur: number; color: string; }

const BREATH_CFGS: Record<number, { tip: string; phases: BPhase[] }> = {
  2: {
    tip: "Place one hand on your belly. Feel it rise fully on inhale and fall completely on exhale. This activates your vagus nerve for instant calm.",
    phases: [
      { label: "Belly Inhale",  sub: "Let your belly expand — not your chest", dur: 4, color: "#43e97b" },
      { label: "Exhale Slowly", sub: "Release completely — belly falls inward",  dur: 6, color: "#38f9d7" },
    ],
  },
  5: {
    tip: "Dr. Weil's 4-7-8 method: the 7-count hold builds CO₂ tolerance, triggering your body's natural sedation response.",
    phases: [
      { label: "Inhale",  sub: "Breathe in quietly through your nose", dur: 4, color: "#667eea" },
      { label: "Hold",    sub: "Hold your breath — stay completely still", dur: 7, color: "#764ba2" },
      { label: "Exhale",  sub: "Blow out fully through your mouth — 8 counts", dur: 8, color: "#a78bfa" },
    ],
  },
};

// ─── Script Steps ─────────────────────────────────────────────────────────────

interface Step { heading: string; body: string; dur: number; }
interface ScriptCfg { intro: string; steps: Step[]; }

const SCRIPTS: Record<number, ScriptCfg> = {
  6: {
    intro: "Alternate Nostril Breathing (Nadi Shodhana) balances left and right brain hemispheres and clears energy channels.",
    steps: [
      { heading: "Hand Mudra", body: "Place your right hand in Vishnu mudra: fold your index and middle fingers toward your palm. Thumb controls right nostril, ring finger controls left.", dur: 20 },
      { heading: "Close Right, Inhale Left", body: "Press your RIGHT nostril shut with your thumb. Inhale slowly and fully through the LEFT nostril for 4 counts. Feel cool air entering.", dur: 20 },
      { heading: "Switch — Exhale Right", body: "Close LEFT with ring finger. Release thumb from right nostril. Exhale slowly through the RIGHT nostril for 4 counts. Lungs empty.", dur: 20 },
      { heading: "Inhale Right", body: "Keep left closed. Inhale through the RIGHT nostril for 4 counts. Notice the breath traveling up the right side of your nasal passage.", dur: 20 },
      { heading: "Switch — Exhale Left", body: "Close right with thumb. Release ring finger from left nostril. Exhale through the LEFT nostril for 4 counts. One full cycle complete.", dur: 20 },
      { heading: "Continue 8 Cycles", body: "Repeat this pattern 8 times: inhale left → exhale right → inhale right → exhale left. Let the rhythm become meditative and effortless.", dur: 35 },
      { heading: "Rest in Stillness", body: "End on an exhale through the left nostril. Lower your hand. Breathe normally. The extraordinary stillness you feel is brain hemisphere balance.", dur: 20 },
    ],
  },
  7: {
    intro: "Find a quiet space. Sit or lie comfortably. This is a healing journey — there is nothing to do but follow and feel.",
    steps: [
      { heading: "Settle In", body: "Close your eyes. Take three deep breaths. With each exhale, let your body sink deeper into relaxation. You are completely safe here.", dur: 20 },
      { heading: "Your Safe Garden", body: "Imagine a beautiful, peaceful garden — your personal sanctuary. See the colours of flowers, feel warm sunlight on your skin, hear soft birdsong.", dur: 25 },
      { heading: "Meet Younger You", body: "In the distance, a child sits alone. As you walk closer you recognise them — it is you, at an age when you needed love most.", dur: 30 },
      { heading: "Open Your Heart", body: "Kneel down and meet their eyes. Place your hand on their shoulder. Say softly: 'I see you. I'm here now. You are not alone anymore.'", dur: 30 },
      { heading: "Give the Love", body: "Hold this younger self close. Feel the warmth between you. Every old wound, every 'not enough' — let it dissolve with each exhale.", dur: 35 },
      { heading: "Promise & Protect", body: "Look them in the eyes and promise: 'I will always protect you. I will always love you. You are worthy of all good things in this world.'", dur: 30 },
      { heading: "Return Whole", body: "The child smiles and merges gently back into your heart. They live inside you now — safe and loved. When ready, open your eyes. You are whole.", dur: 20 },
    ],
  },
  8: {
    intro: "Sit comfortably with your spine straight. You are safe. Whatever fear arises can only pass through — it cannot stay.",
    steps: [
      { heading: "Ground Yourself", body: "Feel the weight of your body. Press feet into the floor. Breathe in 4… hold 2… exhale 6. Repeat three times until you feel anchored.", dur: 25 },
      { heading: "Name the Fear", body: "Bring the fear gently to mind. Don't fight it. Simply observe it like watching clouds pass. Where do you feel it in your body right now?", dur: 25 },
      { heading: "Give It Form", body: "Imagine the fear as an object in your hands. What colour is it? What shape? Is it heavy or light? Hold it with curiosity, not resistance.", dur: 20 },
      { heading: "Breathe It Small", body: "With every exhale, this object shrinks. Inhale courage… exhale fear. Each breath makes it smaller, lighter, less powerful over you.", dur: 30 },
      { heading: "Replace with Golden Light", body: "Where the fear sat, pour in golden light — warmth, courage, freedom. Feel it flood your chest, your arms, your legs, every cell.", dur: 30 },
      { heading: "Claim Freedom", body: "Say three times with total conviction: 'I release this fear. I am safe. I choose courage and freedom.' Feel each repetition become more true.", dur: 25 },
      { heading: "Emerge Empowered", body: "Take a deep breath in… and exhale with relief. The fear has passed through and left. Open your eyes. You are measurably freer than before.", dur: 20 },
    ],
  },
  9: {
    intro: "Lie down in bed, covers pulled up. This session guides you gently into deep, restorative sleep. Read slowly.",
    steps: [
      { heading: "Release the Day", body: "Close your eyes. Take one long slow exhale — releasing everything that happened today. None of it matters right now. This is your time.", dur: 25 },
      { heading: "Soften Your Body", body: "From your toes up — relax them. Your feet… calves… thighs… hips… all softening, releasing, sinking into your mattress.", dur: 30 },
      { heading: "Release Your Torso", body: "Your belly relaxes on each exhale. Your chest opens. Your back melts into the bed. Your shoulders drop away from your ears completely.", dur: 25 },
      { heading: "Quiet Your Mind", body: "Your thoughts are like bubbles rising to the surface. Watch each one float up… and gently pop. You do not follow them. You simply observe.", dur: 30 },
      { heading: "Deepen the Drift", body: "You are floating on warm still water. Each breath carries you deeper. 10… 9… 8… drifting… 7… 6… 5… deeper still into softness…", dur: 35 },
      { heading: "The Threshold", body: "You are at the very edge of sleep. Your body is completely still. Your mind is quiet. There is nothing to do. Nowhere to be. Just drift…", dur: 35 },
      { heading: "Let Go", body: "Let go completely now. Your breathing slows on its own. You are safe, warm, and utterly at peace. Allow sleep to take you gently now…", dur: 30 },
    ],
  },
  10: {
    intro: "These affirmations are seeds planted in your subconscious as you drift to sleep. Read each one, close your eyes, and repeat it silently three times.",
    steps: [
      { heading: "💫 Identity", body: "I am worthy of love, success and happiness exactly as I am right now. My value is unconditional — it does not depend on my productivity.", dur: 22 },
      { heading: "🌙 Peace", body: "I release today's worries with gratitude. Everything that needed to happen today has happened. I am completely at peace with this moment.", dur: 22 },
      { heading: "💰 Abundance", body: "I attract opportunities, wealth and joy into my life effortlessly. Good things continue to come to me even while I sleep and rest.", dur: 22 },
      { heading: "❤️ Love", body: "I am deeply loved and deeply lovable. My relationships are fulfilling and harmonious. Love flows to me and through me freely.", dur: 22 },
      { heading: "💪 Vitality", body: "I wake up tomorrow refreshed, energised and ready to create my best day. My body heals and completely restores itself every single night.", dur: 22 },
      { heading: "🌟 Purpose", body: "I am exactly where I need to be on my journey. My life has deep meaning and direction. Every step I take moves me powerfully forward.", dur: 22 },
      { heading: "😴 Surrender", body: "I let go now and trust the process of my life. Sleep is safe, healing, and deeply nourishing. I drift off in perfect, complete peace…", dur: 25 },
    ],
  },
  11: {
    intro: "This body scan releases the day's accumulated tension layer by layer. Sit or lie comfortably before beginning.",
    steps: [
      { heading: "Head & Face", body: "Close your eyes. Bring awareness to your scalp, forehead, and jaw. Unclench your teeth. Smooth your brow. Let every facial muscle go completely soft.", dur: 25 },
      { heading: "Neck & Shoulders", body: "Roll shoulders back once slowly. Let them drop. The neck carries enormous tension — breathe directly into any tight spots and watch them dissolve.", dur: 20 },
      { heading: "Chest & Heart Space", body: "Place your hand on your heart. Feel its steady rhythm. With each exhale, release any anxiety or pressure from your chest. Let your heart be light.", dur: 25 },
      { heading: "Belly & Core", body: "Let your belly go completely soft. Stop holding in. Breathe belly-first — deep, full, nourishing. The abdomen is where stress hides. Release it all.", dur: 25 },
      { heading: "Hips, Legs & Feet", body: "Unclench your hips. Let thighs go heavy. Wiggle your toes then let them be still. The legs carry you all day — honour them with complete rest.", dur: 20 },
      { heading: "Full Body Energy Cleanse", body: "Visualise a wave of cool, golden light washing from head to toe, dissolving every last pocket of tension it finds. You feel clean, clear, restored.", dur: 30 },
      { heading: "Return Refreshed", body: "Three deep breaths. Wiggle your fingers. Gently open your eyes. You have released the weight of the day. The rest is completely yours.", dur: 20 },
    ],
  },
  12: {
    intro: "Use this the night before or morning of any exam. Sit upright, feet flat, hands relaxed on thighs.",
    steps: [
      { heading: "Centre Yourself", body: "Close your eyes. Take 5 slow breaths. With each exhale, release nervous energy. You are becoming calmer and more focused with every single breath.", dur: 25 },
      { heading: "Recall Your Peak", body: "Remember a time you performed brilliantly — a test aced, a moment of absolute clarity. Feel that confidence as a physical sensation in your chest.", dur: 25 },
      { heading: "Install the Anchor", body: "Squeeze your dominant fist gently as you relive that peak moment. This creates a neurological anchor — a trigger you can fire any time you need it.", dur: 25 },
      { heading: "Visualise the Exam", body: "See the exam room. You walk in calm and prepared. You sit down, read the first question, and the answers flow easily from your prepared mind.", dur: 30 },
      { heading: "Complete the Paper", body: "See yourself completing every question with ease. You check your answers. You feel satisfied with your work. You walk out knowing you gave your best.", dur: 25 },
      { heading: "Power Affirmations", body: "Repeat clearly: 'I am prepared. I am focused. My memory is sharp and clear. Knowledge flows through me easily, naturally and completely.'", dur: 25 },
      { heading: "Activate Your Anchor", body: "Squeeze your fist one more time. Feel the peak confidence rush back instantly. Release. Take a deep breath. Open your eyes. You are absolutely ready.", dur: 20 },
    ],
  },
  13: {
    intro: "The Memory Palace (Method of Loci) is used by memory champions worldwide. This session teaches you to build yours.",
    steps: [
      { heading: "Enter Alpha State", body: "Close your eyes. Count backwards from 10 to 1, breathing slowly. With each number you drop into a calmer, more receptive and absorbent state.", dur: 25 },
      { heading: "Build Your Palace", body: "Visualise a place you know perfectly — your home, your school. Walk to the front door and open it. This familiar space is your memory palace.", dur: 25 },
      { heading: "Place the Information", body: "Think of what you need to memorise. See each piece as a vivid, exaggerated image. Place each image in a specific room. Make them bizarre — that's the point.", dur: 30 },
      { heading: "Walk the Palace", body: "Walk through each room in order. See each image clearly. The more vivid, emotional and unusual the image, the stronger the memory trace becomes.", dur: 30 },
      { heading: "Add All Senses", body: "Add colour, sound, smell and texture to each image. Multi-sensory encoding creates near-permanent retention — this is how memory champions win.", dur: 25 },
      { heading: "Active Retrieval Practice", body: "Without looking — walk back through your palace and retrieve each piece of information. This active recall is the single most powerful memory technique known.", dur: 30 },
      { heading: "Seal It In", body: "Deep breath. Affirm: 'This knowledge is permanently mine. I recall it perfectly under any conditions.' Open your eyes. The palace is built.", dur: 20 },
    ],
  },
  14: {
    intro: "Alpha waves (8-12 Hz) occur when you're relaxed but alert — the ideal mental state for creativity, focus and flow.",
    steps: [
      { heading: "Soften Your Gaze", body: "Sit comfortably. Let your eyes close. Relax your jaw — let it hang slightly open. Feel the physical weight of your body sinking into your seat.", dur: 20 },
      { heading: "Rhythmic Breathing", body: "Breathe in for 4 counts, out for 6. The longer exhale activates your parasympathetic system. Alpha waves begin to emerge naturally.", dur: 25 },
      { heading: "Body Awareness Sweep", body: "Bring soft awareness to different body parts — not to change anything, simply to observe. This present-moment focus generates alpha brain activity.", dur: 25 },
      { heading: "The Pulsing Light", body: "Visualise a soft golden-white light at your third eye (between your brows). See it pulse gently at a slow, steady rhythm — 10 pulses per second.", dur: 25 },
      { heading: "The Flow State", body: "As alpha deepens, problems begin to solve themselves. Creative solutions surface effortlessly. Your mind becomes sharp, clear and completely uncluttered.", dur: 30 },
      { heading: "Set Your Intention", body: "State your intention once clearly: a project, a challenge, a creative task. Then release it. Your alpha-primed mind will work on it below the surface.", dur: 20 },
      { heading: "Emerge Laser-Focused", body: "Count 1 to 5, growing more alert with each number. 1…2…3…4…5. Eyes open. You are in the optimal focus and creativity state right now.", dur: 20 },
    ],
  },
  15: {
    intro: "The 7 chakras are energy centres along your spine. This session clears and balances each one systematically from root to crown.",
    steps: [
      { heading: "Root Chakra 🔴 — Safety", body: "Base of spine. Grounding, security, belonging. Visualise deep red light glowing here like a warm coal. Affirm: 'I am safe. I am grounded. I belong.'", dur: 28 },
      { heading: "Sacral Chakra 🟠 — Joy", body: "Below your navel. Creativity, emotion, flow. See warm orange light expanding here. Affirm: 'I embrace pleasure, creativity and emotional flow freely.'", dur: 28 },
      { heading: "Solar Plexus 🟡 — Power", body: "Above your navel. Confidence, will, identity. Brilliant yellow light radiates outward like the sun. Affirm: 'I am powerful. I trust myself completely.'", dur: 28 },
      { heading: "Heart Chakra 💚 — Love", body: "Centre of chest. Love, compassion, healing. Emerald green light fills and expands your whole chest. Affirm: 'I give and receive love freely and fully.'", dur: 28 },
      { heading: "Throat Chakra 🔵 — Truth", body: "Your throat. Expression, communication, authenticity. Bright blue light radiates here. Affirm: 'I speak my truth with clarity, kindness and confidence.'", dur: 28 },
      { heading: "Third Eye 🟣 — Intuition", body: "Between your eyebrows. Intuition, vision, wisdom. Deep indigo light pulses here. Affirm: 'I trust my intuition completely. I see clearly and deeply.'", dur: 28 },
      { heading: "Crown Chakra ✨ — Connection", body: "Top of your head. Divine connection, consciousness. Violet-white light pours in from above. Affirm: 'I am connected to all that is. I am one with the universe.'", dur: 32 },
    ],
  },
  16: {
    intro: "True confidence is an internal state, not a performance. This session installs it at a subconscious level that lasts.",
    steps: [
      { heading: "Power Posture", body: "Sit tall. Chin slightly up. Shoulders back and down. Notice immediately how posture shifts your internal state. Your body and mind communicate in both directions.", dur: 20 },
      { heading: "Peak State Recall", body: "Remember a moment of pure confidence — when you felt completely unstoppable. Relive it fully. See what you saw, feel what you felt. Make it vivid and real.", dur: 25 },
      { heading: "Amplify It", body: "Turn up the brightness of that memory. Add colour. Make it bigger, bolder, brighter. Let the confidence spread from your chest to your whole body.", dur: 25 },
      { heading: "Future Projection", body: "See yourself in your next challenge — a meeting, a conversation, a stage. See the confident version of you handling it with effortless ease and grace.", dur: 30 },
      { heading: "Identity Shift", body: "You are not someone trying to be confident. You ARE a confident person. Repeat: 'Confidence is completely natural to me. I was born to lead and thrive.'", dur: 25 },
      { heading: "Physical Anchor", body: "Press your thumb and index finger together. Feel the confidence at its peak. This physical anchor fires confidence any time you need it — use it daily.", dur: 25 },
      { heading: "Emerge", body: "Open your eyes and sit in that feeling for 30 more seconds. You have rewritten a small but significant part of your subconscious self-image.", dur: 20 },
    ],
  },
  17: {
    intro: "Anger held in the body becomes disease. This session releases it safely and completely, then replaces it with peace.",
    steps: [
      { heading: "Acknowledge It", body: "Anger is not bad — it is information. Allow yourself to say: 'I am angry about ___.' Name it without any judgement whatsoever. It is completely valid.", dur: 20 },
      { heading: "Locate in Body", body: "Where do you feel the anger in your body? Chest? Jaw? Stomach? Fists? Place your hand on that spot. Breathe directly and consciously into that area.", dur: 20 },
      { heading: "Safe Release", body: "See the anger as a ball of fire in your body. With each exhale, see it shrinking. Shake your hands out if you feel the urge — this physically releases stored energy.", dur: 25 },
      { heading: "The Message", body: "Ask the anger: 'What are you trying to protect me from?' Listen without forcing. Anger often guards a deeper hurt — grief, fear, or an unmet need.", dur: 25 },
      { heading: "Forgive Yourself First", body: "The hardest step: 'I forgive myself for how I've handled this anger.' You did the best you could with what you knew then. Now you know more.", dur: 25 },
      { heading: "Release Others", body: "Forgiveness does not mean condoning — it means freeing yourself. Visualise the person or situation. Say: 'I release you. I release this. I am completely free.'", dur: 30 },
      { heading: "Fill with Peace", body: "Where the anger was, pour in cool blue water. Feel it wash through every cell. Peace is your natural state. You have fully returned to it.", dur: 25 },
    ],
  },
  18: {
    intro: "Elite athletes and performers use visualisation to pre-program success into the nervous system before execution.",
    steps: [
      { heading: "Laser Beam Focus", body: "Imagine a laser — a single, intensely focused beam of light. This is your attention when fully concentrated. Your mind is capable of that beam. Claim it.", dur: 20 },
      { heading: "Clear the Screen", body: "Close your eyes. Your mind is a cinema screen. Any stray thoughts are simply projectionist errors — escort them out and return to the screen.", dur: 20 },
      { heading: "Your Perfect Focus Session", body: "Visualise your workspace. Everything is organised. Phone is away. You open your task. Your mind locks in immediately and effortlessly. It feels natural.", dur: 25 },
      { heading: "Deep Flow State", body: "Time dissolves. You are fully absorbed. Ideas flow naturally. Your work moves forward. This is flow state — and you can access it intentionally every time.", dur: 25 },
      { heading: "Obstacles Dissolve", body: "When a distraction tries to enter — a noise, a thought — you simply notice it and return to the task. Each return to focus strengthens the muscle.", dur: 25 },
      { heading: "Completion", body: "See yourself finishing the task completely. Feel the deep satisfaction of meaningful, concentrated work. This feeling is its own reward and its own motivation.", dur: 25 },
      { heading: "Activate Now", body: "Deep breath. On the exhale: 'I focus completely. My mind is sharp. I begin right now.' Open your eyes immediately and start — momentum is everything.", dur: 20 },
    ],
  },
  19: {
    intro: "This session programs your mind for deep, effortless learning. Use it 10 minutes before any study session.",
    steps: [
      { heading: "Clear Mental Desktop", body: "For the next session you are a learning machine. Exhale everything distracting. Clear the mental desktop completely. Fresh, clean state activated.", dur: 20 },
      { heading: "Alpha Learning State", body: "Your brain is most receptive in alpha. Breathe slowly: in 4… out 6. Each cycle drops you into a more receptive, absorbent and ready state.", dur: 25 },
      { heading: "Identity: The Scholar", body: "You are not struggling through material. You are a natural learner who absorbs information with ease and genuinely enjoys the process of discovery.", dur: 20 },
      { heading: "Install the Belief", body: "'My memory is excellent. Information sticks instantly to my mind. The more I learn, the easier and more enjoyable learning becomes.' Feel this.", dur: 25 },
      { heading: "See the Neurons", body: "Visualise your brain lighting up — billions of neurons forming new connections with each piece of information. Learning is physical. It is real. It is powerful.", dur: 25 },
      { heading: "Set Your Block", body: "Decide your study duration right now. Tell your unconscious: 'For the next ___ minutes I am completely, deeply, fully focused on learning.'", dur: 20 },
      { heading: "Launch on 3", body: "Count with me: 1 — alert and awake. 2 — focused and ready. 3 — OPEN YOUR EYES AND BEGIN RIGHT NOW.", dur: 15 },
    ],
  },
  20: {
    intro: "Past life regression is a deeply personal journey. Trust whatever comes — there are no wrong experiences here.",
    steps: [
      { heading: "Deep Induction", body: "Close your eyes. Breathe slowly. With each exhale you go 10 times deeper. You are relaxed, open, completely receptive. Your conscious mind steps gently back.", dur: 30 },
      { heading: "The Garden Gate", body: "You find yourself in a beautiful garden. Ahead is an ancient stone gate covered in vines and moss. This gate leads to the library of your soul's entire history.", dur: 25 },
      { heading: "The Infinite Library", body: "You pass through the gate. Before you is a vast, ancient library filled with books — each one a complete lifetime. Your soul has lived many lives. Feel this wisdom.", dur: 30 },
      { heading: "Choose Your Book", body: "One book seems to call to you — its spine glows softly. Walk to it and reach out. This lifetime contains something directly relevant to your current journey.", dur: 25 },
      { heading: "Step Inside", body: "You open the book and step inside it. Notice: are you male or female? What do your hands look like? What are you wearing? What era does this feel like?", dur: 35 },
      { heading: "Receive the Lesson", body: "Ask your soul: 'What from this lifetime is influencing my present life? What pattern am I here to complete or finally release?' Receive whatever comes without judgement.", dur: 35 },
      { heading: "Integration & Return", body: "Thank this past self for their journey and their gifts. Close the book gently. Return through the gate. Three deep breaths. Open your eyes. You have been given a gift.", dur: 30 },
    ],
  },
  4: {
    intro: "This gratitude practice rewires your brain's negativity bias. 5 minutes daily produces measurable increases in happiness within 21 days.",
    steps: [
      { heading: "Settle & Breathe", body: "Close your eyes. Take three slow breaths. Place your hand on your heart. Feel its steady, loyal rhythm. This heart has beaten for you every second of your life.", dur: 20 },
      { heading: "Three People", body: "Bring to mind three people who have positively touched your life — mentors, friends, family. Feel genuine warmth and gratitude for each one in your chest.", dur: 25 },
      { heading: "Three Gifts Today", body: "What three good things happened today — however small? A kind word? A cup of tea? A moment of beauty? Name them and really feel the gratitude for each.", dur: 25 },
      { heading: "Your Body's Gifts", body: "Your heart is beating. Your lungs are breathing. Your eyes see, your ears hear. Flood your body with gratitude for the miracle of its existence.", dur: 20 },
      { heading: "Expand the Feeling", body: "Let the gratitude radiate outward from your chest like a warm light expanding in all directions. You are alive, breathing, present — that alone is a gift.", dur: 25 },
      { heading: "The Gift Forward", body: "Set an intention: 'Today I will express gratitude to one person who may not expect it.' This act completes the gratitude circuit and multiplies your joy.", dur: 20 },
      { heading: "Seal It In", body: "Three deep breaths. On each exhale, whisper 'thank you.' Open your eyes carrying this warmth into the next moment of your day.", dur: 20 },
    ],
  },
};

// ─── Audio configs (Web Audio API) ───────────────────────────────────────────

interface AudioCfg { freq: number; type: OscillatorType; freq2?: number; label: string; desc: string; }

const AUDIO_CFGS: Record<number, AudioCfg> = {
  4:  { freq: 528, type: "sine", label: "528 Hz · Miracle Tone",      desc: "Known as the 'DNA repair' frequency — associated with transformation, love and heart-opening." },
  10: { freq: 432, type: "sine", label: "432 Hz · Natural Harmony",   desc: "Tuned to the frequency of nature. Creates deep relaxation and receptivity for sleep programming." },
  13: { freq: 40,  type: "sine", freq2: 10, label: "Alpha · Gamma Blend", desc: "10 Hz alpha for receptive focus + 40 Hz gamma for memory consolidation — used in neuroscience research." },
  14: { freq: 10,  type: "sine", freq2: 8,  label: "8–12 Hz Alpha Range", desc: "Pure alpha frequency for calm, focused awareness — the doorway to flow state and creative thinking." },
  15: { freq: 396, type: "sine", label: "396 Hz · Liberation Tone",   desc: "Releases guilt and fear. The foundational Solfeggio frequency for chakra cleansing and energy work." },
};

// ─── Shared Modal Shell ───────────────────────────────────────────────────────

const Shell: React.FC<{ tool: HealTool; onClose: () => void; children: React.ReactNode }> = ({ tool, onClose, children }) => {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(160deg, #0f0e1a 0%, #1a1040 100%)`, border: `1.5px solid ${tool.gradient[0]}55`, borderRadius: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${tool.gradient[0]}22`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid rgba(255,255,255,0.07)`, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: `0 6px 20px ${tool.gradient[0]}55` }}>
            {tool.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 900, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tool.title}</div>
            <div style={{ color: tool.gradient[0], fontSize: 11, fontWeight: 700, marginTop: 3 }}>⏱ {tool.duration} · {tool.type}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Breathing XP ─────────────────────────────────────────────────────────────

const BreathingXP: React.FC<{ tool: HealTool; onClose: () => void }> = ({ tool, onClose }) => {
  const cfg = BREATH_CFGS[tool.id];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secs, setSecs] = useState(cfg.phases[0].dur);
  const [cycles, setCycles] = useState(0);
  const phaseIdxRef = useRef(0);
  const secsRef = useRef(cfg.phases[0].dur);

  useEffect(() => {
    const iv = setInterval(() => {
      secsRef.current--;
      if (secsRef.current <= 0) {
        const next = (phaseIdxRef.current + 1) % cfg.phases.length;
        if (next === 0) setCycles(c => c + 1);
        phaseIdxRef.current = next;
        secsRef.current = cfg.phases[next].dur;
      }
      setPhaseIdx(phaseIdxRef.current);
      setSecs(secsRef.current);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const phase = cfg.phases[phaseIdx];
  const isExpand = phaseIdx === 0;
  const transDur = (phaseIdx === 0 || phaseIdx === cfg.phases.length - 1) ? `${phase.dur - 0.1}s` : "0.15s";

  return (
    <Shell tool={tool} onClose={onClose}>
      <div style={{ textAlign: "center", paddingTop: 24 }}>
        <p style={{ color: "#9ca3af", fontSize: 12, margin: "0 0 28px", lineHeight: 1.6 }}>Cycle {cycles + 1} · breathe with the circle</p>

        {/* Animated circle */}
        <div style={{ margin: "0 auto 28px", width: 200, height: 200, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${phase.color}`, animation: "ringPulse 2s ease-out infinite" }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle, ${phase.color}cc 0%, ${phase.color}44 60%, transparent 100%)`, border: `2px solid ${phase.color}`, transform: `scale(${isExpand ? 1.42 : 1})`, transition: `transform ${transDur} cubic-bezier(0.4,0,0.2,1)`, boxShadow: `0 0 ${isExpand ? 56 : 22}px ${phase.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "60%", height: "60%", borderRadius: "50%", background: "#0f0e1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#f3f4f6", lineHeight: 1 }}>{secs}</span>
              <span style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>sec</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 900, color: phase.color, marginBottom: 6, letterSpacing: -0.5 }}>{phase.label}</div>
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>{phase.sub}</div>

        {/* Phase dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {cfg.phases.map((p, i) => (
            <div key={i} style={{ textAlign: "center", opacity: i === phaseIdx ? 1 : 0.3, transition: "opacity 0.3s" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, margin: "0 auto 5px", boxShadow: i === phaseIdx ? `0 0 10px ${p.color}` : "none" }} />
              <span style={{ fontSize: 10, color: "#9ca3af" }}>{p.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "12px 16px" }}>
          <p style={{ color: "#c4b5fd", fontSize: 12, margin: 0, lineHeight: 1.6 }}>💡 {cfg.tip}</p>
        </div>
      </div>
    </Shell>
  );
};

// ─── Script XP (Hypnosis / Guided / Affirmations) ─────────────────────────────

const ScriptXP: React.FC<{ tool: HealTool; onClose: () => void }> = ({ tool, onClose }) => {
  const cfg = SCRIPTS[tool.id];
  const [idx, setIdx] = useState(-1); // -1 = intro screen
  const [countdown, setCountdown] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay || idx < 0) return;
    const step = cfg.steps[idx];
    if (!step) return;
    setCountdown(step.dur);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(iv);
          if (idx < cfg.steps.length - 1) setIdx(i => i + 1);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [idx, autoPlay]);

  const step = idx >= 0 ? cfg.steps[idx] : null;
  const progress = idx >= 0 ? ((idx + 1) / cfg.steps.length) * 100 : 0;

  return (
    <Shell tool={tool} onClose={onClose}>
      {idx === -1 ? (
        <div style={{ textAlign: "center", paddingTop: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{tool.icon}</div>
          <h3 style={{ color: "#f3f4f6", fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{tool.title}</h3>
          <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: "0 auto 32px" }}>{cfg.intro}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setIdx(0); setAutoPlay(false); }} style={{ padding: "12px 24px", borderRadius: 10, border: `1.5px solid ${tool.gradient[0]}`, background: "none", color: tool.gradient[0], fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Manual Pace
            </button>
            <button onClick={() => { setIdx(0); setAutoPlay(true); }} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 6px 20px ${tool.gradient[0]}44` }}>
              Auto-Guided ▶
            </button>
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 20 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#6b7280", fontSize: 11 }}>Step {idx + 1} of {cfg.steps.length}</span>
              {autoPlay && countdown > 0 && <span style={{ color: tool.gradient[0], fontSize: 11, fontWeight: 700 }}>Next in {countdown}s</span>}
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, borderRadius: 4, transition: "width 0.4s" }} />
            </div>
          </div>

          {/* Step content */}
          {step && (
            <div style={{ background: `linear-gradient(145deg, ${tool.gradient[0]}10, ${tool.gradient[1]}06)`, border: `1px solid ${tool.gradient[0]}28`, borderRadius: 18, padding: "24px 22px", marginBottom: 20 }}>
              <div style={{ color: tool.gradient[0], fontSize: 12, fontWeight: 800, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>{step.heading}</div>
              <p style={{ color: "#e5e7eb", fontSize: 15, lineHeight: 1.8, margin: 0 }}>{step.body}</p>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {idx > 0 && (
              <button onClick={() => { setIdx(i => i - 1); setAutoPlay(false); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9ca3af", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ← Back
              </button>
            )}
            {idx < cfg.steps.length - 1 ? (
              <button onClick={() => { setIdx(i => i + 1); setAutoPlay(false); }} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Next →
              </button>
            ) : (
              <button onClick={onClose} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✓ Complete Session
              </button>
            )}
          </div>

          {autoPlay && (
            <button onClick={() => setAutoPlay(false)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              ⏸ Pause auto-advance
            </button>
          )}
          {!autoPlay && idx >= 0 && (
            <button onClick={() => setAutoPlay(true)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${tool.gradient[0]}44`, background: "none", color: tool.gradient[0], fontSize: 12, cursor: "pointer" }}>
              ▶ Resume auto-advance
            </button>
          )}
        </div>
      )}
    </Shell>
  );
};

// ─── Audio XP (Web Audio API tones + guided steps) ────────────────────────────

const AudioXP: React.FC<{ tool: HealTool; onClose: () => void }> = ({ tool, onClose }) => {
  const cfg = AUDIO_CFGS[tool.id];
  const scriptCfg = SCRIPTS[tool.id];
  const [playing, setPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  const startAudio = () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc1 = ctx.createOscillator();
    osc1.type = cfg.type;
    osc1.frequency.value = cfg.freq;
    osc1.connect(gain);
    osc1.start();
    osc1Ref.current = osc1;

    if (cfg.freq2) {
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = cfg.freq2;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.06;
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2Ref.current = osc2;
    }
    setPlaying(true);
  };

  const stopAudio = () => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5);
    }
    setTimeout(() => {
      osc1Ref.current?.stop(); osc2Ref.current?.stop();
      ctxRef.current?.close();
      osc1Ref.current = null; osc2Ref.current = null; ctxRef.current = null;
    }, 600);
    setPlaying(false);
  };

  useEffect(() => () => { osc1Ref.current?.stop(); osc2Ref.current?.stop(); ctxRef.current?.close(); }, []);

  const step = scriptCfg?.steps[stepIdx];

  return (
    <Shell tool={tool} onClose={onClose}>
      <div style={{ paddingTop: 20 }}>
        {/* Tone display */}
        <div style={{ background: `linear-gradient(135deg, ${tool.gradient[0]}18, ${tool.gradient[1]}10)`, border: `1px solid ${tool.gradient[0]}30`, borderRadius: 18, padding: "20px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ color: tool.gradient[0], fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{cfg.label}</div>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: "0 0 16px", lineHeight: 1.6 }}>{cfg.desc}</p>

          {/* Animated bars */}
          {playing && (
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16, height: 32, alignItems: "flex-end" }}>
              {[0.4,0.7,1,0.85,0.6,0.9,0.5,0.75,1,0.65].map((h, i) => (
                <div key={i} style={{ width: 4, height: `${h * 32}px`, background: `linear-gradient(to top, ${tool.gradient[0]}, ${tool.gradient[1]})`, borderRadius: 2, animation: `audioBar${i % 3} ${0.6 + i * 0.07}s ease-in-out infinite alternate` }} />
              ))}
            </div>
          )}

          <button onClick={playing ? stopAudio : startAudio} style={{ padding: "10px 28px", borderRadius: 10, background: playing ? "rgba(239,68,68,0.2)" : `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, border: playing ? "1px solid #ef4444" : "none", color: playing ? "#f87171" : "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: playing ? "none" : `0 6px 20px ${tool.gradient[0]}44` } as React.CSSProperties}>
            {playing ? "⏹ Stop Tone" : "▶ Play Healing Tone"}
          </button>
        </div>

        {/* Script steps */}
        {scriptCfg && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#6b7280", fontSize: 11 }}>Guided Step {stepIdx + 1} / {scriptCfg.steps.length}</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${((stepIdx + 1) / scriptCfg.steps.length) * 100}%`, background: `linear-gradient(90deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
            </div>

            {step && (
              <div style={{ background: `${tool.gradient[0]}0e`, border: `1px solid ${tool.gradient[0]}22`, borderRadius: 16, padding: "20px", marginBottom: 16 }}>
                <div style={{ color: tool.gradient[0], fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{step.heading}</div>
                <p style={{ color: "#e5e7eb", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{step.body}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {stepIdx > 0 && (
                <button onClick={() => setStepIdx(i => i - 1)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#9ca3af", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
              )}
              {stepIdx < scriptCfg.steps.length - 1 ? (
                <button onClick={() => setStepIdx(i => i + 1)} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Next →</button>
              ) : (
                <button onClick={onClose} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Session Complete</button>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes audioBar0 { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
        @keyframes audioBar1 { from { transform: scaleY(0.5); } to { transform: scaleY(0.9); } }
        @keyframes audioBar2 { from { transform: scaleY(0.2); } to { transform: scaleY(0.8); } }
      `}</style>
    </Shell>
  );
};

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

const HealingToolModal: React.FC<{ tool: HealTool; onClose: () => void }> = ({ tool, onClose }) => {
  // Breathing tools with visual circle animation
  if (tool.id === 2 || tool.id === 5) return <BreathingXP tool={tool} onClose={onClose} />;

  // Audio tools with Web Audio API tones
  if (AUDIO_CFGS[tool.id]) return <AudioXP tool={tool} onClose={onClose} />;

  // Everything else: script-based guided journey
  if (SCRIPTS[tool.id]) return <ScriptXP tool={tool} onClose={onClose} />;

  // Fallback
  return (
    <Shell tool={tool} onClose={onClose}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{tool.icon}</div>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Session coming soon.</p>
      </div>
    </Shell>
  );
};

export default HealingToolModal;
