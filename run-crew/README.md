# Run Crew × peakst8 Playbook

[Product note](https://peakst8-basecamp.github.io/product-notes/run-crew/) · Internal · updated 28 Oct 2026 · edit this file directly on GitHub

Run Crew is coaching a group of runners for Reebok ahead of the Adani Ahmedabad Marathon. We're moving them onto the peakst8 app so their training plan, workouts and Saturday runs live in one place, and they stay engaged until race day. This doc has everything needed to run the rollout, in six steps.

**Why peakst8 is doing this**

- Acquire users (about 250)
- Test how the app scales with a real group
- Optional: see if Reebok will pay for it

## Links

### ✅ [Rollout checklist](https://claude.ai/artifact/MNZVVd8tXVs9Xgjrm6MLSz)

The latest checklist and the runner list, ticked live by the team.

### 📲 [Install guide](https://peakst8-basecamp.github.io/product-notes/run-crew/install-guide/)

What runners get to install the app on Android and iPhone. Source: [install-guide/](install-guide/)

### 📱 [App screens](https://peakst8-basecamp.github.io/product-notes/run-crew/app-screens/)

Every screen of the app, journey by journey.

## Before you start

- **One list of users, from Aditya (Run Crew), then it's locked.** Nobody new joins after that, so every number stays honest.
- **The app has to be ready first.** Before any runner installs, the back end is set up:
  - Org "Reebok Training Plan - Run Crew" created
  - Whole month's training plan uploaded
  - Every runner's email whitelisted
  - Runners uploaded to the org
  - Saturday's group run visible on the app
- **One channel for all comms.** There's already a group between Run Crew and peakst8. We use it for all communication, nothing new to set up.
- **Messages to runners come from Aditya.** Runners trust Run Crew's voice. Mahiyar and Hansel help behind it.

| Who | Team | Owns |
| --- | --- | --- |
| Aditya | Run Crew | The runner list, the group, sign-off on every message |
| Rohit Sharma | peakst8 | Back end: org setup, training plan upload, whitelisting, uploading runners |
| Jitin | peakst8 | Front end: everything runners see in the app |
| Mahiyar | peakst8 | Community: onboarding in the group, weekly messages, keeping it running smoothly |
| Hansel | peakst8 | Community: one-to-one runner help, chasing anyone not on the app |
| Sandeep | Reebok | Midpoint review, server-cost decision |

## Step 1: Lock the roster

Agree who's in, once. Everything after this works off one fixed list, kept in the rollout checklist.

- [ ] **Get the runner list from Aditya** (Aditya). The day-one sheet: name, email, phone. Paste it into the checklist's Runners section.
- [ ] **Confirm the list is final, then lock it** (Aditya). This is the upper limit. No new joiners after the lock.
- [ ] **Mark who is active** (Aditya). Active, sometimes or not active, per runner. Tells us who to chase first.
- [ ] **Whitelist every email and phone** (Rohit Sharma). Use "Copy emails + phones" on the checklist. Anyone not whitelisted can't get past sign-in, so check spellings.

## Step 2: Set up the app

Before anyone installs, the app should already look ready for them, with the whole month's plan loaded upfront.

- [ ] **Create the org "Reebok Training Plan - Run Crew"** (Rohit Sharma). On fit.yoscar.in, with the Reebok × Run Crew name and logo.
- [ ] **Upload the whole month's training plan** (Rohit Sharma). From Aditya's Excel sheet, every week of the month at once.
- [ ] **Whitelist every email and upload the runners** (Rohit Sharma). From the locked list in the rollout checklist.
- [ ] **Add the Run Crew coaches** (Jitin). Names, roles and photos, for the "Meet your coach" screen.
- [ ] **Check Saturday's run (31 Oct) shows on the app** (Jitin). On a test runner account, on Android and iPhone.

**Engineering checklist (Rohit Sharma, back end · Jitin, front end)**

- [ ] Every date in Aditya's sheet has a session or a rest day
- [ ] The sheet's columns map to the app's workout fields: type, distance, duration, pace or zone, notes
- [ ] The whole month is imported in one go
- [ ] Saturday group runs for the month added as events, with time and meeting point
- [ ] Runners can open future weeks, not only the current one
- [ ] Today shows the right day's goals (IST)
- [ ] Strava sync ticks off the right day, including late-night runs
- [ ] Plan changes mid-month reach runners without a reinstall
- [ ] A non-roster email sees "You're on the list" and can't get in
- [ ] 5 random days spot-checked against the Excel sheet
- [ ] Next month loaded at least 7 days before it starts

## Step 3: Install guide

Runners get the [install guide](https://peakst8-basecamp.github.io/product-notes/run-crew/install-guide/) in the group. It's branded Reebok Training Plan × Run Crew and only covers installing the app.

**Android (Google Play)**

1. Tap the [download link](https://play.google.com/store/apps/details?id=club.peakst8.app)
2. Tap Install on the Google Play Store
3. Open the app and you're all set

**iPhone (TestFlight)**

1. Install [TestFlight](https://apps.apple.com/app/testflight/id899247664) from the App Store. It's Apple's own app, with the blue propeller icon
2. Tap the invite link: [testflight.apple.com/join/bJPU3a55](https://testflight.apple.com/join/bJPU3a55)
3. Tap Accept, then Install
4. On peakst8's TestFlight page, switch on Automatic Updates, Push Notifications and Email Notifications
5. Move peakst8 to the home screen and open it like any other app

Then sign in with the email registered with Run Crew. Support: support@peakst8.club

- [ ] Guide checked: Reebok × Run Crew branding, no PUMA
- [ ] Android link works
- [ ] iPhone TestFlight link works
- [ ] Guide link pasted into message 1 below

## Step 4: Onboard the runners

Aditya opens it in the Run Crew group; Mahiyar and Hansel do the hand-holding. This runs from launch day to the first Saturday group run (31 Oct). Fill the bits in [brackets] before sending.

**Channel:** the existing group between Run Crew and peakst8. All communication goes through it.

- [ ] **Add Mahiyar and Hansel to the Run Crew group** (Aditya). Introduce them as the people to ask for app help.
- [ ] **Message 1: the app is live** (Aditya, day 0)
- [ ] **Message 2: how to get started** (Mahiyar, day 0)
- [ ] **Help runners sign in and connect Strava** (Mahiyar, Hansel). Tick "On app" and "Strava" in the checklist as each runner is done.
- [ ] **Message 3: Saturday run reminder** (Aditya, Friday)
- [ ] **Message 4: nudge anyone not on the app** (Hansel, day 3 onwards, one to one)

**Message 1: The app is live** (Aditya, Run Crew group)

```
Hi Run Crew 👋 Your Reebok training plan is now on the peakst8 app: your workouts, your coach and our Saturday runs in one place.

Install it here: https://peakst8-basecamp.github.io/product-notes/run-crew/install-guide/
Sign in with the email you registered with Run Crew.

Mahiyar and Hansel are in this group to help.
```

**Message 2: How to get started** (Mahiyar, Run Crew group)

```
Getting started:
1. Install the app (guide above)
2. Sign in with your Run Crew email
3. Add a photo and allow notifications
4. Connect Strava in Profile → Connections

Stuck? Message me or Hansel.
```

**Message 3: Saturday run reminder** (Aditya, Run Crew group)

```
Saturday's group run is on the app: [time, meeting point]. You'll find it under Coming up on Home. See you there!
```

**Message 4: Nudge** (Hansel, direct message)

```
Hi [name], you're not on the peakst8 app yet. Your Reebok plan is there now. Want a hand setting it up?
```

## Step 5: Weekly message before each training week

Once runners are on, one message goes to the group the evening before every training week, through to race week. Proposed slot: Sunday, 7 PM.

```
Week [n] starts tomorrow, crew 👊

This week: [focus] · [total km] km
Key sessions: [session 1], [session 2]
Saturday: group run at [time], [meeting point]

Last week we logged [x] runs together. [one line of praise]

Everything for the week is already in the app. Open Today to see your goals.
```

**Every week**

- [ ] Pull last week's numbers from the app (Mahiyar, by Sunday 12 PM)
- [ ] Draft the message from the template (Mahiyar)
- [ ] Aditya reviews, adds anything extra, and sends it
- [ ] Check the week's sessions and Saturday run on a test account (Mahiyar)
- [ ] DM runners who missed every goal last week (Hansel)

## Step 6: Review with Reebok

At the program's midpoint, Aditya and peakst8 show Sandeep and the Reebok team that the app is driving engagement, and ask Reebok to cover the server cost per user.

- [ ] **Book the call with Sandeep** (Aditya)
- [ ] **Pull the numbers** (Mahiyar): runners on the list, active, on the app, on Strava, workouts logged
- [ ] **Prepare the demo** (peakst8): a test runner account in the Reebok × Run Crew skin
- [ ] **Fix the cost per user** (peakst8): agree the number internally before the call
- [ ] **Hold the call and get Reebok's answer on the server cost** (Aditya, peakst8)

**Agenda**

1. Where the program stands: the numbers above
2. Live demo: sign-in, Today's goals ticking from Strava, coach, Saturday run
3. Engagement since launch: workouts logged, Saturday turnout
4. Server cost per user: Reebok covers it for the group through race day. Total = cost per user per month × runners × months
5. Messages for the second half and race week

## Aditya's asks and open questions

Add to this list as Aditya's asks come up.

- [ ] Roster stays capped at the day-one list
- [ ] The whole month is on the app upfront, not week by week
- [ ] Every message goes out in Aditya's voice from the Run Crew group

**Open questions**

- Weekly message: which day and time, and does Aditya or Mahiyar send it?
- Do runners see a leaderboard, or is it off for this group?
- What share of the roster on the app counts as onboarding done?
- Server cost per user per month, for the Reebok ask
