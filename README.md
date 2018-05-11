![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

<p align="center">
  <a href="http://gallium.live">
    <img alt="GALLIUM" src="http://gallium.live/static/gallium_logo.svg" width="75%"></img>
  </a>
</p>

![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

<p align="center">
  A web-based environment for live coding music.
</p>

<p align="center">
  <i>
  <a href="http://gallium.live">http://gallium.live</a>
  </i>
</p>


![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)


  * [Setup](#setup)
  * [Tutorial](#tutorial)
     * [Basics](#basics)
     * [Multiple Channels](#multiple-channels)
     * [Advanced: Contextual Numeric Interpretation](#advanced-contextual-numeric-interpretation)
     * [Advanced: Polyphony via Stack-Inversion](#advanced-polyphony-via-stack-inversion)

  * [Reference](#reference)
     * [Basic operators](#basic-operators)
     * [MIDI operators](#midi-operators)
     * [Time operators](#time-operators)
  * [Contributing](#contributing)
  * [Acknowledgements](#acknowledgements)
  
![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)

## Setup
You'll need two things:
- A browser with WebMIDI support, like Google Chrome, open to *[gallium.live](http://gallium.live)*.
- A MIDI output device.

Want to send MIDI to a DAW like Ableton or Garageband? Here are instructions for setting up a virtual MIDI device:
  - *OSX* —  [Set up an IAC bus](https://help.ableton.com/hc/en-us/articles/209774225-Using-virtual-MIDI-buses)
  - *Windows* — [Install loopMIDI](http://www.tobias-erichsen.de/software/loopmidi.html)
  - *Linux* — [Enable snd-virmidi](https://jazz-soft.net/download/Jazz-Plugin/LinuxSynth.html)
  
You can also use Gallium directly with a hardware MIDI synth with something like a USB-MIDI cable.

Don't have a DAW or synth? There are great free and open source ones, like [TiMidity++](http://timidity.sourceforge.net/) or [PureData](https://puredata.info/).


## Tutorial
### Basics
Use `note` to start a stream of MIDI notes.
```
note 60
```

`note` can take multiple arguments. The following plays a C-major arpeggio with a cycle of 4 beats:

```
note 60 64 67 72
```

---

You can also write the previous arpeggio with `add`:

```
note 60
add 0 4 7 12
```

What if we want the entire arpeggio to occur all within a beat? We can speed up the stream with `fast`:

```
note 60
add 0 4 7 12
fast 4
```

---

Transformers can run in parallel with `stack`. For example, the following plays a C-major *chord* on every beat:

```
note 60
stack
  add 0
  add 4
  add 7
```

---

Pipes are connected together with `do`.

Use `do` in conjunction with `stack` to do more complex things in parallel. For example:
```
note 60
stack
  do
    fast 2
    add 12
  do
    fast 3
    add 24
```

will play a basic polyrhythm of `72`'s and `84`'s.

---

In Gallium, inputs are supplied to operators either with indentation or with spacing.

For example, we can write the previous expression in fewer lines of code by using parentheses:

```
note 60
stack
  do (fast 2) (add 12)
  do (fast 3) (add 24)
```

We can even write the whole thing in one line!

```
do (note 60) (stack (do (fast 2) (add 12)) (do (fast 3) (add 24)))
```
---

By default, all expressions in gallium with zero indentation are chained together with an implicit `do`. In other words,
```
note 60
fast 2
add 3
```
with no indentation, really just means:
```
do
  note 60
  fast 2
  add 3
```

### Multiple Channels

You can send data to up to 16 different MIDI channels with `chan`. Channels are numbered from 0 to 15.

For example, the following alternates between sending middle C to channel 0 and channel 1:


```
note 60
chan 0 1
```

If you want control two channels separately, use it in conjunction with `stack`. For example:

```
stack
  do
    note 60
    sub 24
    chan 0
  do
    note 60
    add 0 2 5 7
    chan 1
```


### Advanced: Contextual Numeric Interpretation

In Gallium, numbers are interpreted differently depending on the context.

What does that mean? Let's go through a practical example. Suppose we have a pattern that alternates between two notes:

```
note 60 80
```

What if we want to play the 80 twice? We can wrap the 80 in a `do` and simply add a `fast 2`:

```
note 60 (do 80 (fast 2))
```

This is exactly equivalent to:

```
alt (note 60) (do (note 80) (fast 2))
```

where [`alt`](./alt) is the operator that switches between pipes. 

---

What's going on? 

`note` sets an interpretation for numbers in all its subexpressions. Unless another operator overrides this interpretation (like `fast`, in our case), all numbers get interpreted with `note`. 


----

All operators in Gallium that work with numbers behave similarly, including [`fast`](./fast) and [`add`](./add). See the [Reference](./Reference) section for a complete list of operators.


### Advanced: Polyphony via Stack-Inversion

We can exploit contextual numeric interpretation to introduce a useful technique called *stack-inversion*, which allows concise ways to do variations on polyphony.

Here is a stream of C-major triads:

```
note 60
stack (add 0) (add 4) (add 7)
```

Writing the `add` three times can get a bit cumbersome. Stack-inversion allows us to write `add` just once:

```
note 60
add (stack 0 4 7)
```


---

With stack-inversion, we can whip up a delay effect, which simulataneously plays a stream of notes and then shifted copies of itself:

```
shift (stack 0 0.5)
```

where [`shift`](./shift) is an operator that shifts notes in time by an offset in beats.


## Reference

### Basic operators

#### i
```
i : P
```

The identity pipe. Takes the input and simply returns it.

#### m
```
m : P
```

The mute pipe. Takes the input and returns nothing.

#### do
```
do : ...P -> P
```
Connects pipes together.

#### stack
```
stack : ...P -> P
```
Runs pipes in parallel.

#### alt

```
alt : ...P -> P
```

Alternates between pipes on every beat.

### alt0, alt1, alt2, alt3, alt4, alt5, alt6

```
alt(n) : ...P -> P
```

Alternates between pipes every 2^n beats.

Note alt0 is equivalent to alt.

### out0, out1, out2, out3, out4, out5, out6

```
out(n) : ...P -> P
```

Alternates between pipes every 2^n beats. Pipes perceive time 2^n times slower.

Note out0 is equivalent to alt.

### in0, in1, in2, in3, in4, in5, in6

```
in(n) : ...P -> P
```

Alternates between pipes every (1/2)^n beats. Pipes perceive time 2^n times faster.

Note in0 is equivalent to alt.


### MIDI Operators

#### note
```
 note : ...P -> P
(note): Number -> P
````

Starts a new stream of MIDI notes. `note` will ignore data from the previous pipe and overwrite it with a new stream.

*Alternates between pipes on every beat.*

#### add
```
 add: ...P -> P
(add): Number -> P
````

Transposes a stream of MIDI notes up a given number of semitones.

*Alternates between pipes on every beat.*

#### sub
```
 sub: ...P -> P
(sub): Number -> P
````

Transposes a stream of MIDI notes down a given number of semitones.

*Alternates between pipes on every beat.*


#### chan

```
 chan : ...P -> P
(chan): Number -> P
````

Sets the MIDI channel.

*Alternates between pipes on every beat.*


#### len

```
 len : ...P -> P
(len): Number -> P
````

Sets the note lengths in beats. Default length is 1.

*Alternates between pipes on every beat.*


### Time Operators

#### fast

```
 fast : ...P -> P
(fast): Number -> P
````

*Alternates between pipes on every beat.*

Speeds up the pattern by a given multiplier.

#### slow

```
 slow : ...P -> P
(slow): Number -> P
````

*Alternates between pipes on every beat.*

Slows down the pattern by a given multiplier.


#### shift

```
 shift : ...P -> P
(shift): Number -> P
````

*Alternates between pipes on every beat.*

Shifts the pattern forward by an offset in beats.



## Contributing
Found a bug? Missing something? Want to make things happen? Please read the [Contributing](./CONTRIBUTING.md) document for more information.

## Acknowledgements

Inspired by [Tidal](https://tidalcycles.org/).

Thanks to [Originate](http://www.originate.com/) for sponsoring this as a 20% project!
