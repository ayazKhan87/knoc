# 🎵 Neon Piano Tiles

A stunning piano tile rhythm game with automatic MP3 synchronization, built for mobile browsers with a cyberpunk neon aesthetic.

## ✨ Features

- **🎯 Automatic Beat Detection**: Analyzes MP3 files and generates tile patterns automatically
- **📱 Mobile Optimized**: Touch controls and responsive design for mobile devices
- **🎨 Stunning Visuals**: Neon cyberpunk aesthetic with particle effects and animations
- **🎮 Multiple Game Modes**: Practice, 2-Minute Challenge, and Endless modes
- **🎵 Audio Synchronization**: Perfect sync between audio and visual elements
- **📊 Scoring System**: Combo multipliers, accuracy tracking, and star ratings
- **⚡ Performance Optimized**: 60fps rendering with object pooling and efficient algorithms

## 🚀 Getting Started

### Installation

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. For mobile testing, serve the files through a web server (required for audio playback)

### Running Locally

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 🎮 How to Play

1. **Load Audio**: Drag and drop an MP3 file or click to browse
2. **Select Mode**: Choose Practice, 2-Min Challenge, or Endless
3. **Wait for Analysis**: The game automatically analyzes your MP3 and generates tile patterns
4. **Play**: Tap the lanes when tiles reach the hit zone
5. **Score**: Perfect timing = more points and combo multipliers!

### Controls

- **Mobile**: Tap the lanes to hit tiles
- **Desktop**: Click the lanes to hit tiles
- **Keyboard**: 
  - `Spacebar`: Pause/Resume
  - `M`: Mute/Unmute
  - `Escape`: Return to menu

## 🎵 Audio Requirements

- **Format**: MP3, WAV, OGG, or M4A
- **Duration**: Up to 2 minutes for Challenge mode
- **Quality**: Any quality, but higher quality provides better beat detection
- **Genre**: Works best with music that has clear beats (electronic, pop, rock, etc.)

## 🛠️ Technical Details

### Architecture

- **Frontend**: HTML5 Canvas + Vanilla JavaScript
- **Audio**: Web Audio API for beat detection and playback
- **Rendering**: 60fps canvas rendering with object pooling
- **Mobile**: Touch events with preventDefault for optimal performance

### Beat Detection Algorithm

1. **Spectral Analysis**: FFT-based frequency analysis
2. **Energy Calculation**: Computes energy peaks in audio signal
3. **Tempo Estimation**: Calculates BPM from beat intervals
4. **Pattern Generation**: Creates tile sequences based on musical structure
5. **Intensity Mapping**: Varies tile density with song intensity

### Performance Optimizations

- Object pooling for tiles and particles
- Efficient canvas rendering with minimal redraws
- Mobile-specific optimizations for touch events
- Adaptive quality based on device capabilities

## 📱 Mobile Features

- **Touch Controls**: Full-width touch areas for easy tapping
- **Responsive Design**: Optimized for portrait and landscape orientations
- **PWA Support**: Can be installed as a web app
- **Offline Capability**: Service worker for offline functionality
- **Performance**: Optimized for mobile devices with limited resources

## 🎨 Visual Effects

- **Neon Aesthetic**: Glowing effects with cyberpunk colors
- **Particle Systems**: Hit effects with particle bursts
- **Screen Effects**: Flash, shake, and pulse effects
- **Combo Animations**: Special effects for combo milestones
- **Lane Highlights**: Visual feedback for lane interactions

## 🔧 Customization

### Modifying Visual Styles

Edit `styles.css` to customize:
- Color schemes
- Animation timings
- Mobile breakpoints
- Visual effects

### Adjusting Game Mechanics

Edit `js/gameEngine.js` to modify:
- Tile speed and timing
- Scoring system
- Game modes
- Difficulty progression

### Audio Analysis Settings

Edit `js/audioEngine.js` to adjust:
- Beat detection sensitivity
- BPM calculation
- Pattern generation algorithms
- Audio processing parameters

## 🐛 Troubleshooting

### Common Issues

1. **Audio not playing**: Ensure you're serving files through a web server (not file://)
2. **Poor beat detection**: Try songs with clearer beats or adjust detection parameters
3. **Performance issues**: Reduce visual effects or use a more powerful device
4. **Touch not working**: Check if the page is properly loaded and touch events are enabled

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Mobile Browsers**: Optimized for modern mobile browsers

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 🎵 Sample Music

For testing, you can use any MP3 file with clear beats. The game works best with:
- Electronic music
- Pop songs
- Rock music
- Any music with a steady beat

## 🔮 Future Features

- [ ] Multiplayer support
- [ ] Custom tile pattern editor
- [ ] Social features and leaderboards
- [ ] More visual themes
- [ ] Advanced audio analysis
- [ ] VR/AR support

---

**Enjoy playing Neon Piano Tiles! 🎵✨**
