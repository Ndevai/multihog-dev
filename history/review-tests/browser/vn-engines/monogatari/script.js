/* global monogatari */
monogatari.assets ('scenes', { 'glade': 'glade.jpg' });
monogatari.characters ({
	's': { name: 'Seraphina', color: '#ff79a3', directory: 'sera', sprites: { neutral: 'neutral.png', caring: 'caring.png' } },
	'm': { name: 'Mara', color: '#5bcaff' }
});
monogatari.script ({
	'Start': [
		'show scene glade with fadeIn',
		'show character s neutral',
		'You wake with a start in a room of warm light.',
		's Ah, you are awake at last. You were hurt in the forest, but you are safe now.',
		'm Where am I?',
		'show character s caring',
		's You are in my glade. Rest a while longer.',
		'nvl The glade is quiet in the late light, with moss over the roots of the old oaks and a thin stream running past the cottage door, bright where the sun falls through the leaves and dark under the ferns, and somewhere past the window a bird keeps calling the same two notes as if it had a question nobody in the cottage would answer before night.',
		's Eat. It will help.',
		'end'
	]
});
