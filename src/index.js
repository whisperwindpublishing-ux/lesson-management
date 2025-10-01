/**
 * WordPress dependencies
 */
const { render, useState, useEffect, Fragment, useCallback } = wp.element;
const apiFetch = wp.apiFetch;

/**
 * Decodes HTML entities from a string.
 * @param {string} text The text to decode.
 * @returns {string} The decoded text.
 */
const decodeEntities = (text) => {
    if (typeof text !== 'string') return text;
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

/**
 * LevelManager Component
 * Manages CRUD operations for the 'Level' custom post type.
 */
const LevelManager = ({ initialLevels, refetchData, levelCptSlug }) => {
    const [levels, setLevels] = useState(initialLevels);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Keep the local state in sync with the data fetched from the parent App component.
    useEffect(() => {
        setLevels(initialLevels);
    }, [initialLevels]);

    // Memoize handlers to prevent unnecessary re-renders
    const handleSelectLevel = useCallback((level) => {
        setSelectedLevel(level);
        setIsCreating(false);
    }, []);

    const handleCreateNew = useCallback(() => {
        setIsCreating(true);
        setSelectedLevel({
            title: { rendered: '' },
            meta: { sort_order: '' }
        });
    }, []);

    const handleLevelChange = useCallback((field, value) => {
        setSelectedLevel(prev => ({
            ...prev,
            title: field === 'title' ? { ...prev.title, rendered: value } : prev.title,
            meta: field === 'sort_order' ? { ...prev.meta, sort_order: value } : prev.meta,
        }));
    }, []);

    const handleSaveLevel = useCallback(() => {
        if (!selectedLevel) return;

        setIsSaving(true);
        const method = isCreating ? 'POST' : 'PUT';
        const path = isCreating ? `/wp/v2/${levelCptSlug}` : `/wp/v2/${levelCptSlug}/${selectedLevel.id}`;

        const payload = {
            title: selectedLevel.title.rendered,
            meta: {
                sort_order: selectedLevel.meta.sort_order ? parseInt(selectedLevel.meta.sort_order, 10) : 0,
            },
            status: 'publish',
        };

        apiFetch({ path, method, data: payload })
            .then(() => {
                setSuccessMessage(`Level ${isCreating ? 'created' : 'updated'} successfully!`);
                setIsSaving(false);
                setIsCreating(false);
                setSelectedLevel(null);
                refetchData(); // Trigger a data refetch in the parent component
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                alert('Error saving level.');
                setIsSaving(false);
            });
    }, [selectedLevel, isCreating, levelCptSlug, refetchData]);

    const handleDeleteLevel = useCallback((levelId) => {
        if (!window.confirm('Are you sure you want to delete this level? This cannot be undone.')) {
            return;
        }

        setIsSaving(true);
        apiFetch({ path: `/wp/v2/${levelCptSlug}/${levelId}`, method: 'DELETE' })
            .then(() => {
                setSuccessMessage('Level deleted successfully!');
                setIsSaving(false);
                setSelectedLevel(null);
                refetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                alert('Error deleting level.');
                setIsSaving(false);
            });
    }, [levelCptSlug, refetchData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: List of Levels */}
            <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-lg h-min">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-slate-900">All Levels</h2>
                    <button
                        onClick={handleCreateNew}
                        className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        + New
                    </button>
                </div>
                <ul className="space-y-2">
                    {levels.slice().sort((a, b) => a.meta.sort_order - b.meta.sort_order).map(level => (
                        <li key={level.id}>
                            <button
                                onClick={() => handleSelectLevel(level)}
                                className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${selectedLevel && selectedLevel.id === level.id ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border`}
                            >
                                <span className="font-semibold text-slate-800">{decodeEntities(level.title.rendered)}</span>
                                <span className="text-sm text-slate-500 ml-2">(Order: {level.meta.sort_order})</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Column 2: Edit/Create Form */}
            <div className="md:col-span-2">
                {(selectedLevel || isCreating) && (
                    <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-3">
                            {isCreating ? 'Create New Level' : `Editing: ${decodeEntities(selectedLevel.title.rendered)}`}
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="level-title" className="block text-sm font-medium text-slate-700">Level Name</label>
                                <input type="text" id="level-title" value={decodeEntities(selectedLevel.title.rendered)} onChange={e => handleLevelChange('title', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="level-sort-order" className="block text-sm font-medium text-slate-700">Sort Order</label>
                                <input type="number" id="level-sort-order" value={selectedLevel.meta.sort_order} onChange={e => handleLevelChange('sort_order', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <button onClick={handleSaveLevel} disabled={isSaving} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-md text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                    {isSaving ? 'Saving...' : (isCreating ? 'Create Level' : 'Save Changes')}
                                </button>
                                {successMessage && <p className="text-green-600 font-semibold transition-opacity duration-300">{successMessage}</p>}
                            </div>
                            {!isCreating && selectedLevel && (
                                <button onClick={() => handleDeleteLevel(selectedLevel.id)} disabled={isSaving} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Delete Level</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * SkillManager Component
 * Manages CRUD operations for the 'Skill' custom post type.
 */
const SkillManager = ({ initialSkills, levels, refetchData, skillCptSlug }) => {
    const [skills, setSkills] = useState(initialSkills);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setSkills(initialSkills);
    }, [initialSkills]);

    const handleSelectSkill = useCallback((skill) => {
        setSelectedSkill(skill);
        setIsCreating(false);
    }, []);

    const handleCreateNew = useCallback(() => {
        setIsCreating(true);
        setSelectedSkill({
            title: { rendered: '' },
            meta: { sort_order: '', level_associated: '' }
        });
    }, []);

    const handleSkillChange = useCallback((field, value) => {
        setSelectedSkill(prev => ({
            ...prev,
            title: field === 'title' ? { ...prev.title, rendered: value } : prev.title,
            meta: field === 'sort_order' || field === 'level_associated'
                ? { ...prev.meta, [field]: value }
                : prev.meta,
        }));
    }, []);

    const handleSaveSkill = useCallback(() => {
        if (!selectedSkill) return;

        setIsSaving(true);
        const method = isCreating ? 'POST' : 'PUT';
        const path = isCreating ? `/wp/v2/${skillCptSlug}` : `/wp/v2/${skillCptSlug}/${selectedSkill.id}`;

        const payload = {
            title: selectedSkill.title.rendered,
            meta: {
                sort_order: selectedSkill.meta.sort_order ? parseInt(selectedSkill.meta.sort_order, 10) : 0,
                level_associated: selectedSkill.meta.level_associated ? parseInt(selectedSkill.meta.level_associated, 10) : null,
            },
            status: 'publish',
        };

        apiFetch({ path, method, data: payload })
            .then(() => {
                setSuccessMessage(`Skill ${isCreating ? 'created' : 'updated'} successfully!`);
                setIsSaving(false);
                setIsCreating(false);
                setSelectedSkill(null);
                refetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                alert('Error saving skill.');
                setIsSaving(false);
            });
    }, [selectedSkill, isCreating, skillCptSlug, refetchData]);

    const handleDeleteSkill = useCallback((skillId) => {
        if (!window.confirm('Are you sure you want to delete this skill? This cannot be undone.')) {
            return;
        }

        setIsSaving(true);
        apiFetch({ path: `/wp/v2/${skillCptSlug}/${skillId}`, method: 'DELETE' })
            .then(() => {
                setSuccessMessage('Skill deleted successfully!');
                setIsSaving(false);
                setSelectedSkill(null);
                refetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                alert('Error deleting skill.');
                setIsSaving(false);
            });
    }, [skillCptSlug, refetchData]);

    const skillsByLevel = skills.reduce((acc, skill) => {
        const levelId = skill.meta.level_associated || 'uncategorized';
        if (!acc[levelId]) {
            acc[levelId] = [];
        }
        acc[levelId].push(skill);
        return acc;
    }, {});

    const sortedLevels = levels.slice().sort((a, b) => a.meta.sort_order - b.meta.sort_order);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: List of Skills, grouped by Level */}
            <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-lg h-min">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-slate-900">All Skills</h2>
                    <button onClick={handleCreateNew} className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">+ New</button>
                </div>
                <div className="space-y-4">
                    {sortedLevels.map(level => (
                        (skillsByLevel[level.id] && skillsByLevel[level.id].length > 0) && (
                            <div key={level.id}>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">{level.title.rendered}</h3>
                                <ul className="space-y-2 pl-2 border-l-2 border-slate-200">
                                    {skillsByLevel[level.id].sort((a, b) => a.meta.sort_order - b.meta.sort_order).map(skill => (
                                        <li key={skill.id}> 
                                            <button onClick={() => handleSelectSkill(skill)} className={`w-full text-left p-2 rounded-lg transition-all duration-150 ${selectedSkill && selectedSkill.id === skill.id ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border`}>
                                                <span className="font-medium text-slate-800">{decodeEntities(skill.title.rendered)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div> 
                        )
                    ))}
                    {/* Render uncategorized skills */}
                    {skillsByLevel['uncategorized'] && skillsByLevel['uncategorized'].length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2 italic">Uncategorized</h3>
                            <ul className="space-y-2 pl-2 border-l-2 border-slate-200">
                                {skillsByLevel['uncategorized'].sort((a, b) => a.meta.sort_order - b.meta.sort_order).map(skill => (
                                    <li key={skill.id}><button onClick={() => handleSelectSkill(skill)} className={`w-full text-left p-2 rounded-lg transition-all duration-150 ${selectedSkill && selectedSkill.id === skill.id ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border`}><span className="font-medium text-slate-800">{decodeEntities(skill.title.rendered)}</span></button></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Column 2: Edit/Create Form */}
            <div className="md:col-span-2">
                {(selectedSkill || isCreating) && (
                    <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-3">{isCreating ? 'Create New Skill' : `Editing: ${decodeEntities(selectedSkill.title.rendered)}`}</h2>
                        <div className="space-y-6">
                            <div><label htmlFor="skill-title" className="block text-sm font-medium text-slate-700">Skill Name</label><input type="text" id="skill-title" value={decodeEntities(selectedSkill.title.rendered)} onChange={e => handleSkillChange('title', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            <div><label htmlFor="skill-level" className="block text-sm font-medium text-slate-700">Associated Level</label><select id="skill-level" value={selectedSkill.meta.level_associated} onChange={e => handleSkillChange('level_associated', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"><option value="">-- Select a Level --</option>{sortedLevels.map(level => (<option key={level.id} value={level.id}>{decodeEntities(level.title.rendered)}</option>))}</select></div>
                            <div><label htmlFor="skill-sort-order" className="block text-sm font-medium text-slate-700">Sort Order</label><input type="number" id="skill-sort-order" value={selectedSkill.meta.sort_order} onChange={e => handleSkillChange('sort_order', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                        </div>
                        <div className="mt-8 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <button onClick={handleSaveSkill} disabled={isSaving} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-md text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{isSaving ? 'Saving...' : (isCreating ? 'Create Skill' : 'Save Changes')}</button>
                                {successMessage && <p className="text-green-600 font-semibold transition-opacity duration-300">{successMessage}</p>}
                            </div>
                            {!isCreating && selectedSkill && (<button onClick={() => handleDeleteSkill(selectedSkill.id)} disabled={isSaving} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Delete Skill</button>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * GroupManager Component
 * Manages CRUD operations for the 'Group' custom post type.
 */
const GroupManager = ({ initialGroups, levels, users, swimmers, camps, animals, refetchData, groupCptSlug }) => {
    const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const [groups, setGroups] = useState(initialGroups);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setGroups(initialGroups);
        if (selectedGroup && selectedGroup.id) {
            // Only update the selected group if the master list has changed
            if (initialGroups !== groups) {
                const updatedSelectedGroup = initialGroups.find(g => g.id === selectedGroup.id);
                setSelectedGroup(updatedSelectedGroup || null);
            }
        }
    }, [initialGroups]);

    const handleSelectGroup = useCallback((group) => {
        setSelectedGroup(group);
        setIsCreating(false);
    }, []);

    const handleCreateNew = useCallback(() => {
        setIsCreating(true);
        setSelectedGroup({
            title: '',
            level: null,
            days: [],
            group_time: '',
            instructor: [],
            swimmers: [],
            lesson_type: '',
            dates_offered: [],
            archived: false,
            year: new Date().getFullYear(),
            'lm-camp': [],
            'lm-animal': [],
        });
    }, []);

    const handleGroupChange = useCallback((field, value) => {
        setSelectedGroup(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleMultiSelectChange = (field, selectedOptions) => {
        const values = Array.from(selectedOptions, option => option.value);
        handleGroupChange(field, values);
    };

    const handleSaveGroup = useCallback(() => {
        if (!selectedGroup) return;
        setIsSaving(true);

        // For updating, we now use a POST to our custom route. Creating still uses the default route.
        const method = 'POST';
        const path = isCreating ? `/wp/v2/${groupCptSlug}` : `/${LMData.namespace}/groups/${selectedGroup.id}`;

        const payload = {
            title: selectedGroup.title, // This is now correct
            status: 'publish',
            meta: {
                level: selectedGroup.meta.level ? parseInt(selectedGroup.meta.level.id, 10) : null,
                days: selectedGroup.meta.days || [],
                group_time: selectedGroup.meta.group_time,
                instructor: (selectedGroup.meta.instructor || []).map(id => parseInt(id, 10)),
                swimmers: (selectedGroup.meta.swimmers || []).map(id => parseInt(id, 10)),
                lesson_type: selectedGroup.meta.lesson_type,
                dates_offered: selectedGroup.meta.dates_offered || [],
                archived: selectedGroup.meta.archived,
                year: selectedGroup.meta.year ? parseInt(selectedGroup.meta.year, 10) : null,
            },
            'lm-camp': (selectedGroup['lm-camp'] || []).map(id => parseInt(id, 10)),
            'lm-animal': (selectedGroup['lm-animal'] || []).map(id => parseInt(id, 10)),
        };

        apiFetch({ path, method, data: payload })
            .then(() => {
                setSuccessMessage(`Group ${isCreating ? 'created' : 'updated'} successfully!`);
                setIsSaving(false);
                if (isCreating) {
                    setIsCreating(false);
                    setSelectedGroup(null);
                }
                refetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                console.error("Error saving group:", error);
                alert('Error saving group. Check the console for details.');
                setIsSaving(false);
            });
    }, [selectedGroup, isCreating, groupCptSlug, refetchData]);

    const handleDeleteGroup = useCallback((groupId) => {
        if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
        setIsSaving(true);
        apiFetch({ path: `/wp/v2/${groupCptSlug}/${groupId}`, method: 'DELETE' })
            .then(() => {
                setSuccessMessage('Group deleted successfully!');
                setIsSaving(false);
                setSelectedGroup(null);
                refetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(error => {
                console.error("Error deleting group:", error);
                alert('Error deleting group. Check the console for details.');
                setIsSaving(false);
            });
    }, [groupCptSlug, refetchData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Left Column: Group List */}
            <div className="lg:col-span-1 xl:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-lg h-min">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-slate-900">All Groups</h2>
                    <button onClick={handleCreateNew} className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">+ New</button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <ul className="space-y-3">
                    {groups
                        .filter(group => group.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(group => (
                            <li key={group.id}>
                                <button onClick={() => handleSelectGroup(group)} className={`w-full text-left p-3 rounded-xl transition-all duration-150 ${selectedGroup && selectedGroup.id === group.id ? 'bg-indigo-50 border-indigo-400 border shadow-md' : 'bg-white hover:bg-slate-100/70 border border-slate-200 shadow-sm'}`}>
                                    <h3 className="font-bold text-slate-800">{decodeEntities(group.title)}</h3>
                                    {group.meta.level && <p className="text-sm text-slate-600">Level: {decodeEntities(group.meta.level.title)}</p>}
                                </button>
                            </li>
                        ))}
                </ul>
            </div>

            {/* Right Column: Group Details Form */}
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                {(selectedGroup || isCreating) && (
                    <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-lg" key={selectedGroup ? selectedGroup.id : 'new'}>
                        <div className="flex flex-wrap justify-between items-center mb-6 border-b pb-3 gap-4">
                            <h2 className="text-2xl font-bold text-slate-900">{isCreating ? 'Create New Group' : `Details for: ${decodeEntities(selectedGroup.title)}`}</h2>
                            <button onClick={handleSaveGroup} disabled={isSaving} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-md text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                {isSaving ? 'Saving...' : (isCreating ? 'Create Group' : 'Save Changes')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label htmlFor="group-title" className="block text-sm font-medium text-slate-700">Group Name</label><input id="group-title" type="text" placeholder="Group Name" value={selectedGroup.title} onChange={e => handleGroupChange('title', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            <div><label htmlFor="group-time" className="block text-sm font-medium text-slate-700">Time</label><input id="group-time" type="time" value={selectedGroup.meta.group_time || ''} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, group_time: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            <div><label htmlFor="group-year" className="block text-sm font-medium text-slate-700">Year</label><input id="group-year" type="number" placeholder="Year" value={selectedGroup.meta.year || ''} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, year: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            <div><label htmlFor="group-lesson-type" className="block text-sm font-medium text-slate-700">Lesson Type</label><input id="group-lesson-type" type="text" placeholder="Lesson Type" value={selectedGroup.meta.lesson_type || ''} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, lesson_type: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            <div><label htmlFor="group-level" className="block text-sm font-medium text-slate-700">Level</label><select id="group-level" value={selectedGroup.meta.level ? selectedGroup.meta.level.id : ''} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, level: { id: e.target.value, title: e.target.options[e.target.selectedIndex].text } })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">-- Select Level --</option> 
                                    {levels.map(level => <option key={level.id} value={level.id}>{decodeEntities(level.title.rendered)}</option>)}
                                </select></div>
                            <div className="md:col-span-2"><label htmlFor="group-dates" className="block text-sm font-medium text-slate-700">Dates Offered</label><textarea id="group-dates" placeholder="One date per line (e.g., YYYY-MM-DD)" value={(selectedGroup.meta.dates_offered || []).join('\n')} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, dates_offered: e.target.value.split('\n') })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Days of the Week</label>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">{WEEK_DAYS.map(day => <label key={day} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={(selectedGroup.meta.days || []).includes(day)} onChange={e => { const newDays = e.target.checked ? [...selectedGroup.meta.days, day] : selectedGroup.meta.days.filter(d => d !== day); handleGroupChange('meta', { ...selectedGroup.meta, days: newDays }); }} /> {day}</label>)}</div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Instructors</label>
                                <select multiple value={selectedGroup.meta.instructor || []} onChange={e => { const values = Array.from(e.target.selectedOptions, option => option.value); handleGroupChange('meta', { ...selectedGroup.meta, instructor: values }); }} className="mt-1 block w-full h-32 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {users.map(user => <option key={user.id} value={user.id}>{decodeEntities(user.name)}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Camps</label>
                                <select multiple value={selectedGroup['lm-camp'] || []} onChange={e => handleMultiSelectChange('lm-camp', e.target.selectedOptions)} className="mt-1 block w-full h-32 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {camps.map(camp => <option key={camp.id} value={camp.id}>{decodeEntities(camp.name)}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Animals</label>
                                <select multiple value={selectedGroup['lm-animal'] || []} onChange={e => handleMultiSelectChange('lm-animal', e.target.selectedOptions)} className="mt-1 block w-full h-32 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {animals.map(animal => <option key={animal.id} value={animal.id}>{decodeEntities(animal.name)}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Swimmers</label>
                                <select multiple value={selectedGroup.meta.swimmers || []} onChange={e => { const values = Array.from(e.target.selectedOptions, option => option.value); handleGroupChange('meta', { ...selectedGroup.meta, swimmers: values }); }} className="mt-1 block w-full h-48 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {swimmers.map(swimmer => <option key={swimmer.id} value={swimmer.id}>{decodeEntities(swimmer.title.rendered)}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={selectedGroup.meta.archived} onChange={e => handleGroupChange('meta', { ...selectedGroup.meta, archived: e.target.checked })} /> Archived</label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-between items-center gap-4">
                            {!isCreating && selectedGroup && <button onClick={() => handleDeleteGroup(selectedGroup.id)} disabled={isSaving} className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">Delete Group</button>}
                            <div className="flex items-center gap-4 ml-auto">
                                {successMessage && <p className="text-green-600 font-semibold">{successMessage}</p>}
                                <button onClick={handleSaveGroup} disabled={isSaving} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-md text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{isSaving ? 'Saving...' : (isCreating ? 'Create Group' : 'Save Changes')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Main App Component
 * This is the root of our React application.
 */
const App = () => {
    // State to manage the active tab and data
    const [activeTab, setActiveTab] = useState('groups');
    const [groups, setGroups] = useState([]);
    const [levels, setLevels] = useState([]);
    const [skills, setSkills] = useState([]);
    const [users, setUsers] = useState([]);
    const [swimmers, setSwimmers] = useState([]);
    const [camps, setCamps] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [fetchCounter, setFetchCounter] = useState(0); // Add a counter to trigger refetch
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsMenuOpen, setSettingsMenuOpen] = useState(false);

    const refetchData = useCallback(() => setFetchCounter(c => c + 1), []);

    // Fetch initial data when the component mounts
    useEffect(() => {
        setIsLoading(true);
        const groupCptSlug = LMData.post_types.group;
        const levelCptSlug = LMData.post_types && LMData.post_types.level ? LMData.post_types.level : 'lm_level';
        const skillCptSlug = LMData.post_types && LMData.post_types.skill ? LMData.post_types.skill : 'lm_skill';
        const swimmerCptSlug = LMData.post_types.swimmer; // This is correct
        const campTaxSlug = 'lm-camp';
        const animalTaxSlug = 'lm-animal';

        Promise.all([
            apiFetch({ path: `/${LMData.namespace}/groups` }),
            apiFetch({ path: `/wp/v2/${levelCptSlug}?per_page=100` }),
            apiFetch({ path: `/wp/v2/${skillCptSlug}?per_page=100` }),
            apiFetch({ path: `/wp/v2/users?per_page=100&roles=editor,administrator,author` }), // Fetch users who can be instructors
            apiFetch({ path: `/wp/v2/${swimmerCptSlug}?per_page=100` }),
            apiFetch({ path: `/wp/v2/${campTaxSlug}?per_page=100` }),
            apiFetch({ path: `/wp/v2/${animalTaxSlug}?per_page=100` }),
        ]).then(([groupsData, levelsData, skillsData, usersData, swimmersData, campsData, animalsData]) => {
                setGroups(groupsData);
                setLevels(levelsData);
                setSkills(skillsData);
                setUsers(usersData);
                setSwimmers(swimmersData);
                setCamps(campsData);
                setAnimals(animalsData);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching initial data:', error);
                setIsLoading(false);
            });
    }, [fetchCounter]);

    const tabs = [
        { id: 'groups', label: 'Groups' },
        { id: 'swimmers', label: 'Swimmers' },
        { id: 'evaluations', label: 'Evaluations' },
    ];

    const tabColorClasses = {
        groups: 'bg-indigo-600/10 text-indigo-700 border-indigo-600',
        swimmers: 'bg-green-600/10 text-green-700 border-green-600',
        evaluations: 'bg-violet-600/10 text-violet-700 border-violet-600',
        default: 'bg-slate-600/10 text-slate-700 border-slate-600',
    };

    return (
        // Overrides WP admin styling to fill the screen and sets a background
        <Fragment>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Lesson Management</h1>

            {/* Sleek Tab Navigation Bar */}
            <div className="flex justify-between items-center border-b-2 border-slate-200 mb-8 bg-white/70 backdrop-blur-sm sticky top-0 z-10 rounded-t-lg shadow-sm p-2">
                <nav className="flex space-x-2 lg:space-x-4" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <a
                                key={tab.id}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab(tab.id);
                                }}
                                className={`
                                    ${activeTab === tab.id 
                                        ? `${tabColorClasses[tab.id] || tabColorClasses.default} shadow-sm`
                                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                    }
                                    whitespace-nowrap px-4 py-2 font-semibold text-sm rounded-lg transition-all duration-200 border-b-2
                                `}
                            >
                                {tab.label}
                            </a>
                        ))}
                    </nav>

                {/* Settings Kebab Menu */}
                <div className="relative">
                    <button
                        onClick={() => setSettingsMenuOpen(!isSettingsMenuOpen)}
                        className="p-2 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                    {isSettingsMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveTab('levels'); setSettingsMenuOpen(false); }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                >
                                    Levels
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveTab('skills'); setSettingsMenuOpen(false); }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                >
                                    Skills
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'groups' && (
                    isLoading ? <p className="text-slate-500 p-4">Loading...</p> : 
                    <GroupManager initialGroups={groups} levels={levels} users={users} swimmers={swimmers} camps={camps} animals={animals} refetchData={refetchData} groupCptSlug={LMData.post_types.group} />
                )}
                {/* Placeholder for other tabs (uses the card styling) */}
                {activeTab === 'swimmers' && (
                    <div className="p-8 bg-white border border-green-200 rounded-xl shadow-lg">
                         <p className="text-slate-500 text-lg">Swimmers List/Details container will be developed here.</p>
                    </div>
                )}
                {activeTab === 'evaluations' && (
                    <div className="p-8 bg-white border border-violet-200 rounded-xl shadow-lg">
                        <p className="text-slate-500 text-lg">Evaluations List/Details container will be developed here.</p>
                    </div>
                )}
                {activeTab === 'levels' && (
                    <LevelManager initialLevels={levels} refetchData={refetchData} levelCptSlug={LMData.post_types.level} />
                )}
                {activeTab === 'skills' && (
                    <SkillManager initialSkills={skills} levels={levels} refetchData={refetchData} skillCptSlug={LMData.post_types.skill} />
                )}
            </div>
        </Fragment>
    );
};

/**
 * Render the App to the DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // The root element ID is 'lm-admin-app' based on your admin-page.php
    const appRoot = document.getElementById('lm-admin-app');
    if (appRoot) {
        // We need to use wp.element's renderer, not the global ReactDOM
        render(<App />, appRoot);
    }
});