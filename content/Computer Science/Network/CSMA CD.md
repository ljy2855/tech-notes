
CSMA/CD stands for Carrier Sense Multiple Access / Collision Detection. Its primary focus is to manage access to a shared medium/bus where only one host can transmit at a given point in time.

CSMA/CD algorithm:


- Before sending a frame, it checks whether another host is already transmitting a frame.
- If no one is transmitting, it starts transmitting the frame.
- If two hosts transmit at the same time, we have a collision.
- Both hosts stop sending the frame and they send everyone a 'jam signal' notifying everyone that a collision occurred
- They are waiting for a random time before sending it again
- Once each host waited for a random time, they try to send the frame again and so the cycle starts again