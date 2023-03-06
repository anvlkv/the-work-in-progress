import {Episode} from './Standard/Episode';
import {EpisodeEntryProps} from './Standard/types';
import {INTRO, makeEnding, makePomodoro, WARNING} from './constants';

const script: EpisodeEntryProps[] = [
	{
		type: 'slides',
		props: [
			WARNING,
			{
				text: `Episode 01`,
				commentary: [
					0.5,
					'Welcome to the first episode of the work in progress by twopack.gallery',
				],
			},
			INTRO,
			{
				title: `the WIP Ep 01`,
				text: `POC: the speaking head animation with remotion`,
				commentary: [
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
		type: 'video',
		props: {
			commentary: [
				{
					from: 100,
					tts: [
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
				{from: 1035, tts: ['I intend to create a lip-sync animation']},
				{
					from: 1119,
					tts: [
						'It offers some interesting or rather promising template',
						'I will simply use the hello word template',
					],
				},
				{
					from: 2474,
					tts: ['Nice!', 'The readme file tells me how to use the project'],
				},
				{from: 3035, tts: ['So ', 'yarn start']},
				{from: 3635, tts: ['Ok, cool', 'Here is our preview']},
				{from: 3801, tts: ['And just the logo component']},
				{from: 3872, tts: ['Let us see how they did it']},
				{
					from: 4120,
					tts: [
						'So they use their own register root function to register Remotion Root',
					],
				},
				{
					from: 4506,
					tts: ['And that is like a directory root with our compositions'],
				},
				{
					from: 4705,
					tts: [
						'The duration has to be in frames and seems it has to be determined upfront',
					],
				},
				{from: 4871, tts: ['The hello world component itself']},
				{from: 5253, tts: ['These are the animations']},
				{from: 5470, tts: ['The title component']},
				{
					from: 6054,
					tts: [
						'Simply an h one with animations',
						0.5,
						'Let us just look around for what they use here',
					],
				},
				{from: 7089, tts: ['Arc component is an SVG, nice!']},
				{
					from: 8211,
					tts: ['So these were the arcs of the react logo, I suppose'],
				},
				{from: 8719, tts: ['That is a start', 'I need a head first']},
				{from: 9513, tts: ['Just gonna take our logo']},
				{from: 9968, tts: ['I am the short guy']},
				{from: 10796, tts: ['Something like this']},
				{from: 11498, tts: ['Add a mouth']},
				{from: 12136, tts: ['Talking back through paper bag']},
				{from: 12805, tts: ['Just clean up a little', 0.5]},
				{from: 14671, tts: ['Looks about right']},
				{from: 15750, tts: ['Let us just export an SVG']},
				{from: 16968, tts: ['Need to clean up the SVG before using in react']},
				{from: 17713, tts: ['Just this part']},
				{
					from: 18929,
					tts: ['What could possibly be wrong?', 'Let it return our SVG'],
				},
				{from: 19643, tts: ['Strict linter', 'Good for health']},
				{
					from: 20325,
					tts: ['Let us just use the head here instead of arc', 1],
				},
				{
					from: 21591,
					tts: [
						'So I did not clean ups the SVG, yeah',
						'Let us format it first',
					],
				},
				{
					from: 21853,
					tts: ['The style it was complaining about and a few more'],
				},
				{
					from: 22561,
					tts: [
						'Just fix them here',
						'React CSS properties object it must be',
					],
				},
				{from: 24257, tts: ['Multi-cursor to the rescue']},
				{
					from: 26018,
					tts: ['And some more garbage from exporting with affinity designer'],
				},
				{from: 26332, tts: ['See what came out']},
				{from: 26664, tts: ['Yay it is spinning']},
				{from: 26900, tts: ['Let us just work with that']},
				{
					from: 27189,
					tts: ['Try to keep the project organized along the way'],
				},
				{from: 28972, tts: ['Clean up a little']},
				{from: 33293, tts: ['Time to do some research']},
				{from: 38170, tts: ['So, how am I going to do this?']},
				{from: 43634, tts: ['All the way till here']},
			],
			src: '01/01.webm',
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{
					from: 304,
					tts: [
						'I start with simply tilting my head',
						'From side to side, you know',
						'Just like I always do',
					],
				},
				{from: 1134, tts: ['Suppose I can make an animation like that?']},
				{
					from: 1327,
					tts: ['Maybe it is time to take another look at the docs?'],
				},
				{from: 1543, tts: ['So what do they have?']},
				{from: 1789, tts: ['Sounds like what I need ', 'the fundamentals']},
				{from: 2357, tts: ['And the animations']},
				{
					from: 3749,
					tts: ['I can probably limit it to just the interpolate function'],
				},
				{from: 5770, tts: ['I will try just that']},
				{
					from: 7359,
					tts: ['Hmm, suppose the output is radians? ', 'Well, why not?'],
				},
				{from: 8118, tts: ['I can do that with transform attribute']},
				{from: 8621, tts: ['Just to refresh myself on how that works']},
				{from: 8897, tts: ['Here it is, the rotation']},
				{from: 9610, tts: ['So the angle but what are the other two']},
				{
					from: 10629,
					tts: ['Obviously the rotation origin, they are optional'],
				},
				{
					from: 12699,
					tts: ['Rearrange things a little, so that I rotate the entire head'],
				},
				{from: 18689, tts: ['Looks almost good']},
				{from: 20487, tts: ['Nope, these were in degrees']},
			],
			src: '01/02.webm',
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{from: 0, tts: ['So the head is off']},
				{
					from: 224,
					tts: [
						'Sadly, I have this transform matrix from my export applied to the whole thing',
					],
				},
				{from: 408, tts: ['And now the body is separate']},
				{
					from: 1280,
					tts: [
						'And by the way the rotation is in degrees',
						'Thank you, MDN docs',
					],
				},
				{
					from: 1608,
					tts: [
						'Maybe I can add the rotation origin as a ref and rotate around it',
					],
				},
				{from: 3148, tts: ['So how would that look like? ']},
				{from: 3937, tts: ['Not quite the motion I was hoping for']},
				{
					from: 4546,
					tts: [
						'So of course the coordinates from the editor are relative to art board there and not to what I have inside the matrix',
					],
				},
				{from: 5243, tts: ['Well, what if we rotate the whole thing', 0.5]},
				{from: 5624, tts: ['Yeah, almost']},
				{
					from: 7224,
					tts: ['So can I get rid of the nested transform or not?'],
				},
				{from: 7687, tts: ['And one more nested transform to be sure']},
				{
					from: 7872,
					tts: [
						'So yeah, these are the transformations I did',
						'But I was hopeful for some clean SVG especially after I exported',
					],
				},
				{
					from: 8047,
					tts: [
						'The only expand is for strokes',
						'It is probably not going to change much',
					],
				},
				{from: 9030, tts: ['And no other expand indeed', 'Ok I try it']},
				{from: 9598, tts: ['And nope, there it is the transform matrix']},
				{
					from: 10065,
					tts: ['Maybe there is a better way of doing this all together?'],
				},
				{from: 10355, tts: ['Oh, path might sound like it']},
				{from: 10592, tts: ['Cool but not quite that']},
				{from: 11035, tts: ['Well, what else do they have?']},
				{from: 12597, tts: ['Hmm, transform origin']},
				{
					from: 13036,
					tts: ['Just see what does it look like without the transform'],
				},
				{
					from: 13319,
					tts: [
						'Alright, things are off and kind of back to their original positions from the logo drawing',
					],
				},
				{from: 14362, tts: ['So just make it separate matrices']},
				{from: 15442, tts: ['Looks correct', 0.5]},
				{from: 16238, tts: ['Let us move over just the transforms']},
				{
					from: 17836,
					tts: ['Suppose I can put the transformations together like this'],
				},
				{from: 18110, tts: ['Hey, it does it! But only once']},
				{from: 18448, tts: ['Let it loop', 0.5]},
				{from: 18768, tts: ['Nice, an animation loop component']},
				{
					from: 19470,
					tts: [
						'Just put this behavior apart from the rest and make it a tilting head component with its own animations',
					],
				},
				{from: 20851, tts: ['Hello world becomes our head component']},
				{from: 22160, tts: ['And just return the head component']},
				{from: 22433, tts: ['In a loop please']},
				{from: 23265, tts: ['Perhaps I can pass rotation through props']},
				{from: 23654, tts: ['And take this part to my new component']},
				{from: 24638, tts: ['Use the prop there']},
				{from: 25029, tts: ['I will use the loop here instead']},
				{from: 25680, tts: ['Set some duration']},
				{from: 25910, tts: ['Ok, it does it but kind of one way']},
				{from: 27478, tts: ['Ah, so I can nest a loop like this']},
				{from: 28389, tts: ['Maybe I can interpolate differently']},
				{
					from: 29202,
					tts: [
						'Add the steps in between for the output ranges of the head tilt property',
					],
				},
				{from: 29615, tts: ['The ranges must have the same length']},
				{from: 31045, tts: ['Should something like this work?']},
				{from: 31223, tts: ['Sort of', 'Still not what I wanted']},
				{from: 32245, tts: ['So they use duration In Frames ']},
				{from: 32657, tts: ['Nope, not the actual durations']},
				{
					from: 33848,
					tts: ['Ok that is little better but still not doing the full loop'],
				},
				{from: 35265, tts: ['But enough on that']},
				{from: 44048, tts: ['Maybe using these options helps']},
				{
					from: 48450,
					tts: ['Yes, the duration in frames from the video config'],
				},
				{from: 51602, tts: ['Ok, here it is tilting with a mouth on it']},
				{from: 53040, tts: ['How does one even make something like this?']},
				{from: 55755, tts: ['Suppose I can use different lip shapes']},
				{from: 57435, tts: ['Start with just opening and closing the mouth']},
				{from: 60162, tts: ['Assume a boolean prop for now']},
			],
			src: '01/03.webm',
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{
					from: 127,
					tts: ['So I want this head to appear in the corner of video'],
				},
				{from: 425, tts: ['Check for video in the docs']},
				{from: 667, tts: ['Props seem convenient']},
				{from: 888, tts: ['It supports different codecs']},
				{from: 1323, tts: ['Hmm, can I get an audio stream from that too?']},
				{
					from: 1837,
					tts: ['It is a native element maybe it has an API for that?'],
				},
				{
					from: 2808,
					tts: [
						'Ahh, seems one can just pass a video file to audio element as well',
					],
				},
				{from: 3127, tts: ['What does that look like in remotion?']},
				{
					from: 3862,
					tts: ['Seems I can just make it', 'Take a video component'],
				},
				{from: 4534, tts: ['And add it to my composition']},
				{
					from: 6182,
					tts: [
						'What do I do with this absolute fill, do I need to wrap the video?',
					],
				},
				{from: 6900, tts: ['Ok, can just use it like this']},
				{from: 7515, tts: ['Need a video sample', 'Let us add one']},
				{from: 9895, tts: ['Oh no, visual studio is trying to be helpful']},
				{from: 10053, tts: ['Just rename it']},
				{
					from: 11915,
					tts: [
						'And I should use the public directory instead when using static files',
					],
				},
				{from: 12782, tts: ['Alright, here is our video']},
			],
			src: '01/04.webm',
			endAt: 13666,
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{
					from: 1245,
					tts: ['Ok, so it works', 'I just need to adjust couple things'],
				},
				{from: 1440, tts: ['The head should be']},
				{from: 1827, tts: ['On a white background']},
				{from: 2389, tts: ['And how do use the Absolute fill at all?']},
				{from: 2503, tts: ['Ah so just the CSS properties']},
				{from: 3008, tts: ['A small rectangle in the bottom right corner']},
				{from: 3419, tts: ['Hmm, so what units should I use for video']},
				{from: 3684, tts: ['Say ten percent']},
				{from: 4997, tts: ['So far quite the opposite']},
				{from: 5346, tts: ['What actually happens?', 'Let us inspect']},
				{from: 7213, tts: ['Ah, there already props on the absolute fill']},
				{from: 7541, tts: ['Maybe this helps']},
				{from: 8003, tts: ['About right']},
				{from: 8690, tts: ['Time to do something about the mouth']},
				{from: 9132, tts: ['So I can get audio data to visualize it']},
				{from: 10689, tts: ['I can just import my sample for now', 0.5]},
				{from: 14253, tts: ['Eh, I need to make peace with typescript']},
				{from: 17865, tts: ['Yes it’s declare module']},
				{from: 18382, tts: ['So let us finally use the audio data']},
				{
					from: 19691,
					tts: ['First, I need to install the remotion media utils package'],
				},
				{from: 21200, tts: ['And what do I get back from it?']},
				{from: 21469, tts: ['Suppose I can work with wave forms']},
				{from: 22246, tts: ['Jus check what the audio data looks like']},
				{from: 23110, tts: ['And what does remotion say about using audio']},
				{
					from: 27285,
					tts: [
						'Let us just start with a boolean of some kind to determine if the mouth should be open or not',
					],
				},
				{from: 39951, tts: ['So can I just get a frame like this?', 0.5]},
				{from: 40620, tts: ['And it fails for a completely different reason']},
				{
					from: 41754,
					tts: ['Maybe I need to do something else to get the audio data?'],
				},
				{
					from: 44044,
					tts: ['There is something similar in the docs', 'Let us try it'],
				},
				{
					from: 44751,
					tts: ['Just use the visualization array', 'Very simple'],
				},
			],
			src: '01/05.webm',
			startFrom: 1010,
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{from: 502, tts: ['Can not return undefined from react FC component']},
				{from: 975, tts: ['Has to be fragment or null']},
				{from: 1297, tts: ['Let us see how we did?']},
				{from: 1942, tts: ['No data, no head']},
				{from: 3399, tts: ['Just check the docs']},
				{
					from: 4841,
					tts: [
						'I did not change anything and its there',
						'Yay, that is some loading time',
					],
				},
				{
					from: 5039,
					tts: [
						'And it works!',
						'I can see head opens its mouth when there is a noise',
					],
				},
				{
					from: 5824,
					tts: ['But let s figure how to make it an actual lip sync'],
				},
				{from: 6197, tts: ['Does waveform actually mean something?']},
				{from: 6373, tts: ['For someone it does']},
				{
					from: 6882,
					tts: ['Rudrabha s Wav two Lip seems like thing for doing just that'],
				},
				{from: 10614, tts: ['Beautiful work!']},
				{
					from: 10700,
					tts: ['Sadly no license and sounds like much work for one episode'],
				},
				{from: 11359, tts: ['Maybe its already out there?']},
				{
					from: 13129,
					tts: [
						'If to simplify it a little?',
						'I need just some shapes, it does not have to get all the letters right',
					],
				},
				{
					from: 14296,
					tts: ['Does not seem like many solutions at first sight'],
				},
				{from: 15071, tts: ['Well, Can I just see what it looks like?']},
				{
					from: 15834,
					tts: [
						'So it looks like different sounds would indeed appear as distinct shapes',
					],
				},
				{from: 22243, tts: ['Ok not quite the lip sync but I have an idea']},
				{from: 22578, tts: ['Always wanted too do that with an SVG path']},
				{
					from: 23984,
					tts: [
						'Let us see how bad I am at counting and add 16 more points on each quarter',
					],
				},
				{
					from: 31143,
					tts: [
						'Change the type of these points in hope that sag code will reflect that in some obvious way',
					],
				},
				{from: 32901, tts: ['I only need the new path']},
				{from: 33481, tts: ['Worthy a component of its own']},
				{from: 34315, tts: ['Let it take the wave']},
				{
					from: 35093,
					tts: ['And use the new component in our Head component'],
				},
				{
					from: 37038,
					tts: [
						'Who does not like a good prop drill? ',
						'I am in for one now',
					],
				},
				{
					from: 43717,
					tts: ['So it is a path d attribute', 'Let us pull up the docs', 0.5],
				},
				{
					from: 46121,
					tts: ['I am looking at a path drawn with path commands'],
				},
				{
					from: 46439,
					tts: [
						'Let us look for the Q or C commands in our path for one of the curves',
						0.25,
						'Find those points here on the path',
					],
				},
				{from: 48746, tts: ['Split there and work with that']},
				{from: 51702, tts: ['So make it sixteen points']},
				{from: 55059, tts: ['Check what are the points of the cubic curve']},
				{from: 59042, tts: ['Format it to little bit more readable']},
			],
			src: '01/06.webm',
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{from: 1714, tts: ['Wait for the audio data']},
				{
					from: 2280,
					tts: [
						'So the path is there',
						'And I will use the audio data to make these mouse moves',
					],
				},
				{
					from: 3001,
					tts: [
						'Checking if it is open or closed was just a test, so I remove it',
					],
				},
				{from: 6096, tts: ['My little zen garden here']},
				{from: 14284, tts: ['Of course the count is off']},
				{from: 15742, tts: ['Just add to these points']},
				{from: 20816, tts: ['Yes, these are very small numbers']},
				{
					from: 23647,
					tts: [
						'Ha-ha-ha but the matrix transform!',
						'It does it on the x axis',
					],
				},
				{from: 24516, tts: ['Here it is my darling']},
				{from: 25433, tts: ['So be it on the other side']},
				{from: 27981, tts: ['Ooh, this is very little']},
				{
					from: 31424,
					tts: [
						'And let us also adjust the control points, just the same amount',
					],
				},
				{from: 32631, tts: ['So how far was the math?']},
				{
					from: 35148,
					tts: ['Suppose that is one of the other sides of the mouth'],
				},
				{from: 41261, tts: ['Looks sickening']},
				{from: 60972, tts: ['Smoothen-out the math']},
				{from: 64032, tts: ['That is too smooth for me right now']},
			],
			src: '01/07.webm',
		},
	},
	{
		type: 'video',
		props: {
			commentary: [
				{
					from: 0,
					tts: [
						'After some time I got it',
						'The change seems too much or too little most of the time',
					],
				},
				{from: 457, tts: ['Can something help me smoothening a wave?']},
				{from: 1643, tts: ['This looks like one can do it']},
				{from: 4432, tts: ['Try a few random things']},
				{
					from: 5097,
					tts: [
						'Ok so that makes a proof of concept',
						'I have a head in the corner and it moves its mouth',
					],
				},
				{
					from: 6038,
					tts: [
						'If my dear listener has an idea how to make this animation so that the head does not kiss itself on the inside, I welcome your ideas',
					],
				},
				{
					from: 7388,
					tts: [
						'At this point I am going to edit the recordings into an episode and render with remotion to add the head animation',
						'But more on how this went in the next episode',
						0.5,
					],
				},
			],
			src: '01/08.webm',
		},
	},
	{
		type: 'slides',
		props: [makeEnding('first')],
	},
];

export const Ep01 = () => <Episode script={script} id="Episode 01" />;
