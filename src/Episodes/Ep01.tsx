import {Episode, Props} from '../Episode';
import {INTRO, makeEnding, makePomodoro} from './constants';

const script: Props['script'] = [
	{
		script: [
			{
				text: `Episode 01`,
				textToSpeech: [
					0.5,
					'Welcome to the first episode of the work in progress by twopack.gallery',
				],
			},
			INTRO,
			{
				title: `WIP Ep 01`,
				text: `POC: remotion`,
				textToSpeech: [
					0.5,
					'In this episode I will make a proof of concept with remotion',
					0.25,
					'I will use it to create the speaking head animation',
					0.25,
					'You can see its already working in the bottom-right corner of your video',
					0.5,
					'Lets see how it goes',
				],
			},
			makePomodoro(8, 'eight'),
		],
	},
	{
		textToSpeech: [
			{
				from: 100,
				text: [
					'remotion is tool for creating videos using react',
					'I do not have any prior experience working with remotion',
					'I have little experience editing video or audio, except simplistic clips in iMovie',
					'I have some experience with react and other development tools which I will be using through the episode',
					0.5,
					'Let us start by simply following their docs',
					0.5,
					'We need to create a project by executing npm or yarn create video',
				],
			},
			{from: 1035, text: ['I intend to create a lip-sync animation']},
			{
				from: 1119,
				text: [
					'It offers some interesting or rather promising template',
					'I will simply use the hello word template',
				],
			},
			{
				from: 2474,
				text: ['Nice!', 'The readme file tells me how to use the project'],
			},
			{from: 3035, text: ['So ', 'yarn start']},
			{from: 3635, text: ['Ok, cool', 'Here is our preview']},
			{from: 3801, text: ['And just the logo component']},
			{from: 3872, text: ['Let us see how they did it']},
			{
				from: 4120,
				text: [
					'So they use their own register root function to register Remotion Root',
				],
			},
			{
				from: 4506,
				text: ['And that is like a directory root with our compositions'],
			},
			{
				from: 4705,
				text: [
					'The duration has to be in frames and seems it has to be determined upfront',
				],
			},
			{from: 4871, text: ['The hello world component itself']},
			{from: 5253, text: ['These are the animations']},
			{from: 5470, text: ['The title component']},
			{
				from: 6054,
				text: [
					'Simply an h one with animations',
					0.5,
					'Let us just look around for what they use here',
				],
			},
			{from: 7089, text: ['Arc component is an SVG, nice!']},
			{
				from: 8211,
				text: ['So these were the arcs of the react logo, I suppose'],
			},
			{from: 8719, text: ['That is a start', 'I need a head first']},
			{from: 9513, text: ['Just gonna take our logo']},
			{from: 9968, text: ['I am the short guy']},
			{from: 10796, text: ['Something like this']},
			{from: 11498, text: ['Add a mouth']},
			{from: 12136, text: ['Talking back through paper bag']},
			{from: 12805, text: ['Just clean up a little', 0.5]},
			{from: 14671, text: ['Looks about right']},
			{from: 15750, text: ['Let us just export an SVG']},
			{from: 16968, text: ['Need to clean up the SVG before using in react']},
			{from: 17713, text: ['Just this part']},
			{
				from: 18929,
				text: ['What could possibly be wrong?', 'Let it return our SVG'],
			},
			{from: 19643, text: ['Strict linter', 'Good for health']},
			{from: 20325, text: ['Let us just use the head here instead of arc', 1]},
			{
				from: 21591,
				text: [
					'So I did not clean ups the SVG, yeah',
					'Let us format it first',
				],
			},
			{
				from: 21853,
				text: ['The style it was complaining about and a few more'],
			},
			{
				from: 22561,
				text: ['Just fix them here', 'React CSS properties object it must be'],
			},
			{from: 24257, text: ['Multi-cursor to the rescue']},
			{
				from: 26018,
				text: ['And some more garbage from exporting with affinity designer'],
			},
			{from: 26332, text: ['See what came out']},
			{from: 26664, text: ['Yay it is spinning']},
			{from: 26900, text: ['Let us just work with that']},
		],
		videoClipSrc: '01/01.webm',
	},
	{
		textToSpeech: [
			{
				from: 304,
				text: [
					'I start with simply tilting my head',
					'From side to side, you know',
					'Just like I always do',
				],
			},
			{from: 1134, text: ['Suppose I can make an animation like that?']},
			{
				from: 1327,
				text: ['Maybe it is time to take another look at the docs?'],
			},
			{from: 1543, text: ['So what do they have?']},
			{from: 1789, text: ['Sounds like what I need ', 'the fundamentals']},
			{from: 2357, text: ['And the animations']},
			{
				from: 3749,
				text: ['I can probably limit it to just the interpolate function'],
			},
			{from: 5770, text: ['I will try just that']},
			{
				from: 7359,
				text: ['Hmm, suppose the output is radians? ', 'Well, why not?'],
			},
			{from: 8118, text: ['I can do that with transform attribute']},
			{from: 8621, text: ['Just to refresh myself on how that works']},
			{from: 8897, text: ['Here it is, the rotation']},
			{from: 9610, text: ['So the angle but what are the other two']},
			{from: 10629, text: ['Obviously the rotation origin, they are optional']},
			{
				from: 12699,
				text: ['Rearrange things a little, so that I rotate the entire head'],
			},
		],
		videoClipSrc: '01/02.webm',
	},
	{
		textToSpeech: [
			{from: 0, text: ['So the head is off']},
			{
				from: 224,
				text: [
					'Sadly, I have this transform matrix from my export applied to the whole thing',
				],
			},
			{from: 408, text: ['And now the body is separate']},
			{
				from: 1280,
				text: [
					'And by the way the rotation is in degrees',
					'Thank you, MDN docs',
				],
			},
			{
				from: 1608,
				text: [
					'Maybe I can add the rotation origin as a ref and rotate around it',
				],
			},
			{from: 3148, text: ['So how would that look like? ']},
			{from: 3937, text: ['Not quite the motion I was hoping for']},
			{
				from: 4546,
				text: [
					'So of course the coordinates from the editor are relative to art board there and not to what I have inside the matrix',
				],
			},
			{from: 5243, text: ['Well, what if we rotate the whole thing', 0.5]},
			{from: 5624, text: ['Yeah, almost']},
			{from: 7224, text: ['So can I get rid of the nested transform or not?']},
			{from: 7687, text: ['And one more nested transform to be sure']},
			{
				from: 7872,
				text: [
					'So yeah, these are the transformations I did',
					'But I was hopeful for some clean SVG especially after I exported',
				],
			},
			{
				from: 8047,
				text: [
					'The only expand is for strokes',
					'It is probably not going to change much',
				],
			},
			{from: 9030, text: ['And no other expand indeed', 'Ok I try it']},
			{from: 9598, text: ['And nope, there it is the transform matrix']},
			{
				from: 10065,
				text: ['Maybe there is a better way of doing this all together?'],
			},
			{from: 10355, text: ['Oh, path might sound like it']},
			{from: 10592, text: ['Cool but not quite that']},
			{from: 11035, text: ['Well, what else do they have?']},
			{from: 12597, text: ['Hmm, transform origin']},
			{
				from: 13036,
				text: ['Just see what does it look like without the transform'],
			},
			{
				from: 13319,
				text: [
					'Alright, things are off and kind of back to their original positions from the logo drawing',
				],
			},
			{from: 14362, text: ['So just make it separate matrices']},
			{from: 15442, text: ['Looks correct', 0.5]},
			{from: 16238, text: ['Let us move over just the transforms']},
			{
				from: 17836,
				text: ['Suppose I can put the transformations together like this'],
			},
			{from: 18110, text: ['Hey, it does it! But only once']},
			{from: 18448, text: ['Let it loop', 0.5]},
			{from: 18768, text: ['Nice, an animation loop component']},
			{
				from: 19470,
				text: [
					'Just put this behavior apart from the rest and make it a tilting head component with its own animations',
				],
			},
			{from: 20851, text: ['Hello world becomes our head component']},
			{from: 22160, text: ['And just return the head component']},
			{from: 22433, text: ['In a loop please']},
			{from: 23265, text: ['Perhaps I can pass rotation through props']},
			{from: 23654, text: ['And take this part to my new component']},
			{from: 24638, text: ['Use the prop there']},
			{from: 25029, text: ['I will use the loop here instead']},
			{from: 25680, text: ['Set some duration']},
			{from: 25910, text: ['Ok, it does it but kind of one way']},
			{from: 27478, text: ['Ah, so I can nest a loop like this']},
			{from: 28389, text: ['Maybe I can interpolate differently']},
			{
				from: 29202,
				text: [
					'Add the steps in between for the output ranges of the head tilt property',
				],
			},
			{from: 29615, text: ['The ranges must have the same length']},
			{from: 31045, text: ['Should something like this work?']},
			{from: 31223, text: ['Sort of', 'Still not what I wanted']},
			{from: 32245, text: ['So they use duration In Frames ']},
			{from: 32657, text: ['Nope, not the actual durations']},
			{
				from: 33848,
				text: ['Ok that is little better but still not doing the full loop'],
			},
			{from: 35265, text: ['But enough on that']},
		],
		videoClipSrc: '01/03.webm',
	},
	{
		textToSpeech: [
			{
				from: 127,
				text: ['So I want this head to appear in the corner of video'],
			},
			{from: 425, text: ['Check for video in the docs']},
			{from: 667, text: ['Props seem convenient']},
			{from: 888, text: ['It supports different codecs']},
			{from: 1323, text: ['Hmm, can I get an audio stream from that too?']},
			{
				from: 1837,
				text: ['It is a native element maybe it has an API for that?'],
			},
			{
				from: 2808,
				text: [
					'Ahh, seems one can just pass a video file to audio element as well',
				],
			},
			{from: 3127, text: ['What does that look like in remotion?']},
			{
				from: 3862,
				text: ['Seems I can just make it', 'Take a video component'],
			},
			{from: 4534, text: ['And add it to my composition']},
			{
				from: 6182,
				text: [
					'What do I do with this absolute fill, do I need to wrap the video?',
				],
			},
			{from: 6900, text: ['Ok, can just use it like this']},
			{from: 7515, text: ['Need a video sample', 'Let us add one']},
			{from: 9895, text: ['Oh no, visual studio is trying to be helpful']},
			{from: 10053, text: ['Just rename it']},
			{
				from: 11915,
				text: [
					'And I should use the public directory instead when using static files',
				],
			},
		],
		videoClipSrc: '01/04.webm',
		endAt: 14293,
	},
	{
		textToSpeech: [
			{
				from: 1245,
				text: ['Ok, so it works', 'I just need to adjust couple things'],
			},
			{from: 1440, text: ['The head should be']},
			{from: 1827, text: ['On a white background']},
			{from: 2389, text: ['And how do use the Absolute fill at all?']},
			{from: 2503, text: ['Ah so just the CSS properties']},
			{from: 3008, text: ['A small rectangle in the bottom right corner']},
			{from: 3419, text: ['Hmm, so what units should I use for video']},
			{from: 3684, text: ['Say ten percent']},
			{from: 4997, text: ['So far quite the opposite']},
			{from: 5346, text: ['What actually happens?', 'Let us inspect']},
			{from: 7213, text: ['Ah, there already props on the absolute fill']},
			{from: 7541, text: ['Maybe this helps']},
			{from: 8003, text: ['About right']},
			{from: 8690, text: ['Time to do something about the mouth']},
			{from: 9132, text: ['So I can get audio data to visualize it']},
			{from: 10689, text: ['I can just import my sample for now', 0.5]},
			{from: 14253, text: ['Eh, I need to make peace with typescript']},
			{from: 17865, text: ['Yes it’s declare module']},
			{from: 18382, text: ['So let us finally use the audio data']},
			{
				from: 19691,
				text: ['First, I need to install the remotion media utils package'],
			},
			{from: 21200, text: ['And what do I get back from it?']},
			{from: 21469, text: ['Suppose I can work with wave forms']},
			{from: 22246, text: ['Jus check what the audio data looks like']},
			{from: 23110, text: ['And what does remotion say about using audio']},
			{
				from: 27285,
				text: [
					'Let us just start with a boolean of some kind to determine if the mouth should be open or not',
				],
			},
			{from: 39951, text: ['So can I just get a frame like this?', 0.5]},
			{from: 40620, text: ['And it fails for a completely different reason']},
			{
				from: 41754,
				text: ['Maybe I need to do something else to get the audio data?'],
			},
			{
				from: 44044,
				text: ['There is something similar in the docs', 'Let us try it'],
			},
			{from: 45551, text: ['Just use the visualization array', 'Very simple']},
		],
		videoClipSrc: '01/05.webm',
		startFrom: 1010,
	},
	{
		textToSpeech: [
			{from: 502, text: ['Can not return undefined from react FC component']},
			{from: 975, text: ['Has to be fragment or null']},
			{from: 1297, text: ['Let us see how we did?']},
			{from: 1942, text: ['No data, no head']},
			{from: 3399, text: ['Just check the docs']},
			{
				from: 4841,
				text: [
					'I did not change anything and its there',
					'Yay, that is some loading time',
				],
			},
			{
				from: 5039,
				text: [
					'And it works!',
					'I can see head opens its mouth when there is a noise',
				],
			},
			{
				from: 5824,
				text: ['But let s figure how to make it an actual lip sync'],
			},
			{from: 6197, text: ['Does waveform actually mean something?']},
			{from: 6373, text: ['For someone it does']},
			{
				from: 6882,
				text: ['Rudrabha s Wav two Lip seems like thing for doing just that'],
			},
			{from: 10614, text: ['Beautiful work!']},
			{
				from: 10700,
				text: ['Sadly no license and sounds like much work for one episode'],
			},
			{from: 11359, text: ['Maybe its already out there?']},
			{
				from: 13129,
				text: [
					'If to simplify it a little?',
					'I need just some shapes, it does not have to get all the letters right',
				],
			},
			{from: 14296, text: ['Does not seem like many solutions at first sight']},
			{from: 15071, text: ['Well, Can I just see what it looks like?']},
			{
				from: 15834,
				text: [
					'So it looks like different sounds would indeed appear as distinct shapes',
				],
			},
			{from: 22243, text: ['Ok not quite the lip sync but I have an idea']},
			{from: 22578, text: ['Always wanted too do that with an SVG path']},
			{
				from: 23984,
				text: [
					'Let us see how bad I am at counting and add 16 more points on each quarter',
				],
			},
			{
				from: 31143,
				text: [
					'Change the type of these points in hope that sag code will reflect that in some obvious way',
				],
			},
			{from: 32901, text: ['I only need the new path']},
			{from: 33481, text: ['Worthy a component of its own']},
			{from: 34315, text: ['Let it take the wave']},
			{from: 35093, text: ['And use the new component in our Head component']},
			{
				from: 37038,
				text: ['Who does not like a good prop drill? ', 'I am in for one now'],
			},
			{
				from: 43717,
				text: ['So it is a path d attribute', 'Let us pull up the docs', 0.5],
			},
			{from: 46121, text: ['I am looking at a path drawn with path commands']},
			{
				from: 46439,
				text: [
					'Let us look for the Q or C commands in our path for one of the curves',
				],
			},
			{from: 48746, text: ['Split there and work with that']},
			{from: 55059, text: ['Check what are the points of the cubic curve']},
			{from: 59042, text: ['Format it to little bit more readable']},
		],
		videoClipSrc: '01/06.webm',
	},
	{
		textToSpeech: [
			{from: 1714, text: ['Wait for the audio data']},
			{
				from: 2280,
				text: [
					'So the path is there',
					'And I will use the audio data to make these mouse moves',
				],
			},
			{
				from: 3001,
				text: [
					'Checking if it is open or closed was just a test, so I remove it',
				],
			},
			{from: 14284, text: ['Of course the count is off']},
			{from: 15742, text: ['Just add to these points']},
			{from: 20816, text: ['Yes, these are very small numbers']},
			{
				from: 23647,
				text: [
					'Ha-ha-ha but the matrix transform!',
					'It does it on the x axis',
				],
			},
			{from: 24516, text: ['Here it is my darling']},
			{from: 25433, text: ['So be it on the other side']},
			{from: 27981, text: ['Ooh, this is very little']},
			{
				from: 31424,
				text: [
					'And let us also adjust the control points, just the same amount',
				],
			},
			{from: 32631, text: ['So how far was the math?']},
			{
				from: 35148,
				text: ['Suppose that is one of the other sides of the mouth'],
			},
		],
		videoClipSrc: '01/07.webm',
	},
	{
		textToSpeech: [
			{
				from: 0,
				text: [
					'After some time I got it',
					'The change seems too much or too little most of the time',
				],
			},
			{from: 457, text: ['Can something help me smoothening a wave?']},
			{from: 1643, text: ['This looks like one can do it']},
			{from: 4432, text: ['Try a few random things']},
			{
				from: 5097,
				text: [
					'Ok so that makes a proof of concept',
					'I have a head in the corner and it moves its mouth',
				],
			},
			{
				from: 6038,
				text: [
					'If my dear listener has an idea how to make this animation so that the head does not kiss itself on the inside, I welcome your ideas',
				],
			},
			{
				from: 7388,
				text: [
					'At this point I am going to edit the recordings into an episode and render with remotion to add the head animation',
					'But more on how this went in the next episode',
					0.5,
				],
			},
		],
		videoClipSrc: '01/08.webm',
	},
	{
		script: [makeEnding('first')],
	},
];

export const Ep01 = () => <Episode script={script} />;
