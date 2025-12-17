import React, { useState, useRef, useEffect } from 'react';

const aerobics = [
    { name: "Arm Circles", desc: "Make wide circles with arms extended", src: "/static/videos/aerobics/arm_circles.mp4" },
    { name: "High Knees", desc: "Lift knees high, pump arms", src: "/static/videos/aerobics/high_knees.mp4" },
    { name: "Jumping Jack", desc: "Jump, spreading arms and legs", src: "/static/videos/aerobics/jumping_jack.mp4" },
    { name: "Quick Feet", desc: "Run rapidly in place", src: "/static/videos/aerobics/quick_feet.mp4" },
    { name: "Scissor Chops", desc: "Alternate arms in scissor motion", src: "/static/videos/aerobics/scissor_chops.mp4" },
];

const yoga = [
    { name: "Bridge Pose", desc: "Lift hips, shoulders grounded", src: "/static/videos/yoga/bridge_pose.mp4" },
    { name: "Cobra", desc: "Press up, open chest", src: "/static/videos/yoga/cobra.mp4" },
    { name: "Downward Dog", desc: "Hips up, body forms triangle", src: "/static/videos/yoga/downward_dog.mp4" },
    { name: "Extended Triangle", desc: "Reach arm up, legs apart", src: "/static/videos/yoga/extended_triangle.mp4" },
    { name: "Child's Pose", desc: "Sit back on heels, stretch forward", src: "/static/videos/yoga/childs_pose.mp4" },
];

function getTodayYYYYMMDD() {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

function getMonthDays(year, month) {
    const days = [];
    const dt = new Date(year, month, 1);
    while (dt.getMonth() === month) {
        days.push(new Date(dt));
        dt.setDate(dt.getDate() + 1);
    }
    return days;
}

// Text-to-Speech function
const speak = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
};

export default function Exercise({ onClose }) {
    const [step, setStep] = useState("menu");
    const [category, setCategory] = useState(null);
    const [exerciseIdx, setExerciseIdx] = useState(0);
    const [timer, setTimer] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const intervalRef = useRef();
    const [doneDays, setDoneDays] = useState(() => {
        const days = localStorage.getItem("exerciseDoneDays");
        return days ? JSON.parse(days) : [];
    });

    useEffect(() => {
        localStorage.setItem("exerciseDoneDays", JSON.stringify(doneDays));
    }, [doneDays]);

    // Timer countdown
    useEffect(() => {
        if (isActive && !isPaused && timer > 0) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, isPaused, timer]);

    // Auto-advance to next exercise when timer hits 0
    useEffect(() => {
        if (timer === 0 && isActive && hasStarted) {
            setIsActive(false);
            const exercises = category === "Aerobics" ? aerobics : yoga;
            
            if (exerciseIdx < exercises.length - 1) {
                // Announce next exercise (ONLY HERE)
                speak("Next exercise");
                // Auto-start next exercise after 1 second
                setTimeout(() => {
                    setExerciseIdx(exerciseIdx + 1);
                    setTimer(30);
                    setIsActive(true);
                }, 1000);
            } else {
                // All exercises complete (ONLY HERE)
                speak("Workout complete!");
                setDoneDays(days => [...new Set([...days, getTodayYYYYMMDD()])]);
                setStep("finished");
            }
        }
    }, [timer, isActive, exerciseIdx, category, hasStarted]);

    const exercises = category === "Aerobics" ? aerobics : yoga;
    const ex = exercises ? exercises[exerciseIdx] : null;
    const progress = exercises ? ((exerciseIdx + 1) / exercises.length) * 100 : 0;

    const resetState = () => {
        setCategory(null);
        setExerciseIdx(0);
        setTimer(30);
        setIsActive(false);
        setIsPaused(false);
        setHasStarted(false);
        clearInterval(intervalRef.current);
        window.speechSynthesis.cancel(); // Stop any speech
    };

    const handleStartWorkout = () => {
        speak("Start exercise"); // ONLY HERE
        setTimer(30);
        setIsActive(true);
        setIsPaused(false);
        setHasStarted(true);
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
        // No voice here
    };

    const handleSkip = () => {
        if (exerciseIdx < exercises.length - 1) {
            // No voice here
            setExerciseIdx(exerciseIdx + 1);
            setTimer(30);
            setIsActive(true);
            setIsPaused(false);
        }
    };

    const handleStop = () => {
        // No voice here
        resetState();
        setStep("menu");
    };

    const handleBack = () => {
        resetState();
        setStep("menu");
    };

    const handleClose = () => {
        resetState();
        if (onClose) {
            onClose();
        }
    };

    // Menu Screen
    if (step === "menu") {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" 
                onClick={(e) => {
                    if (e.target === e.currentTarget && onClose) {
                        handleClose();
                    }
                }}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                    <button 
                        className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-red-500 transition z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                        }}>
                        ×
                    </button>
                    <div className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Choose Workout</div>
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            className="py-6 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg"
                            onClick={() => { setCategory("Yoga"); setStep("routine"); setExerciseIdx(0); setTimer(30); }}>
                            🧘 Yoga
                        </button>
                        <button 
                            className="py-6 rounded-xl font-bold text-lg bg-orange-500 text-white hover:bg-orange-600 transition shadow-lg"
                            onClick={() => { setCategory("Aerobics"); setStep("routine"); setExerciseIdx(0); setTimer(30); }}>
                            🏃 Aerobics
                        </button>
                        <button 
                            className="py-6 rounded-xl font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition shadow-lg"
                            onClick={() => setStep("calendar")}>
                            📅 Calendar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calendar Screen
    if (step === "calendar") {
        const today = new Date();
        const days = getMonthDays(today.getFullYear(), today.getMonth());
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" 
                onClick={(e) => {
                    if (e.target === e.currentTarget) setStep("menu");
                }}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-2xl font-bold mb-4 text-center text-green-600">Goal Calendar</div>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {days.map((d) => {
                            const ds = d.toISOString().split("T")[0];
                            const done = doneDays.includes(ds);
                            const isToday = ds === getTodayYYYYMMDD();
                            return (
                                <div key={ds}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold
                                        ${done ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}
                                        ${isToday ? "ring-2 ring-blue-500" : ""}`}>
                                    {d.getDate()}
                                </div>
                            );
                        })}
                    </div>
                    <button className="w-full py-3 mb-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition"
                        onClick={() => setDoneDays([])}>Reset Progress</button>
                    <button className="w-full py-3 rounded-xl font-bold bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 transition"
                        onClick={() => setStep("menu")}>← Back to Menu</button>
                </div>
            </div>
        );
    }

    // Routine Screen
    if (step === "routine" && ex) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
                    
                    {/* Header with Back Button */}
                    <div className="flex justify-between items-center mb-3">
                        <button 
                            className="text-gray-600 dark:text-gray-400 hover:text-orange-500 font-semibold transition z-10" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBack();
                            }}>
                            ← Back
                        </button>
                        <div className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {category === "Aerobics" ? "🏃" : "🧘"} {category} Workout
                        </div>
                        <button 
                            className="text-2xl text-gray-400 hover:text-red-500 transition z-10" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}>
                            ×
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="font-bold text-gray-700 dark:text-gray-300">Exercise: {exerciseIdx + 1}/{exercises.length}</span>
                            <span className="font-bold text-green-600">Time: {timer}s</span>
                        </div>
                    </div>

                    {/* Video */}
                    <div className="flex justify-center mb-4">
                        <video className="rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg" 
                            width="400" src={ex.src} autoPlay loop muted />
                    </div>

                    {/* Exercise Info */}
                    <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{ex.name}</div>
                        <div className="text-gray-500 dark:text-gray-400">{ex.desc}</div>
                    </div>

                    {/* Start Workout Button (only shows initially) */}
                    {!hasStarted && (
                        <button className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition mb-3"
                            onClick={handleStartWorkout}>
                            ▶ Start Workout
                        </button>
                    )}

                    {/* Controls (only show after workout started) */}
                    {hasStarted && (
                        <div className="flex gap-2 justify-center mb-3">
                            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
                                onClick={handlePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</button>
                            <button className="px-6 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition"
                                onClick={handleSkip} disabled={exerciseIdx >= exercises.length - 1}>⏭ Skip</button>
                            <button className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
                                onClick={handleStop}>⏹ Stop</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Finished Screen
    if (step === "finished") {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <div className="text-3xl font-bold text-green-600 mb-6">Day Complete!</div>
                    <button className="w-full py-4 mb-3 rounded-xl font-bold text-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                        onClick={() => { resetState(); setStep("menu"); }}>
                        Back to Menu
                    </button>
                    <button className="w-full py-4 rounded-xl font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition"
                        onClick={() => setStep("calendar")}>
                        View Calendar
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
