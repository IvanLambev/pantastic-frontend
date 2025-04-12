import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"

const About = () => {
  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4">About Pantastic</h1>
          <p className="text-lg text-muted-foreground">
            Delivering the luxury of choice, daily. At Pantastic, we've revolutionized the art of pancake making,
            bringing you a perfect blend of traditional flavors and modern innovation.
          </p>
        </div>
        <div className="flex-1">
          <img 
            src="/pancake1.jpg" 
            alt="Delicious Pantastic Pancakes" 
            className="rounded-lg shadow-lg w-full h-[300px] object-cover"
          />
        </div>
      </div>

      {/* Mission Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>Making joy accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <p>To bring delicious, high-quality pancakes to everyone, making every day a little more special with our unique flavors and combinations.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
            <CardDescription>Leading innovation</CardDescription>
          </CardHeader>
          <CardContent>
            <p>To revolutionize the pancake industry through innovative recipes, sustainable practices, and exceptional customer service.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
            <CardDescription>Quality & Care</CardDescription>
          </CardHeader>
          <CardContent>
            <p>We believe in using premium ingredients, maintaining the highest quality standards, and treating every customer like family.</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Our Journey</CardTitle>
          <CardDescription>The story of Pantastic's growth and success</CardDescription>
        </CardHeader>
        <CardContent>
          <Timeline>
            <TimelineItem year="2018" title="The Beginning">
              Opening of our first location in Bulgaria, introducing a revolutionary concept in pancake dining.
            </TimelineItem>
            <TimelineItem year="2019" title="Expansion Begins">
              Successfully launched multiple new locations across major cities, bringing our unique flavors to more customers.
            </TimelineItem>
            <TimelineItem year="2020" title="Innovation in Delivery">
              Adapted to changing times with enhanced delivery services and new safety protocols while maintaining quality.
            </TimelineItem>
            <TimelineItem year="2021" title="Menu Evolution">
              Introduced new signature recipes and expanded our menu to include more diverse options for all tastes.
            </TimelineItem>
            <TimelineItem year="2022" title="Sustainability Initiative">
              Launched our eco-friendly packaging and sustainable sourcing program.
            </TimelineItem>
            <TimelineItem year="2023" title="Digital Transformation">
              Introduced our new mobile app and rewards program to enhance customer experience.
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <img 
            src="/pancake2.jpg" 
            alt="Our Kitchen" 
            className="rounded-lg shadow-lg w-full h-[250px] object-cover mb-4"
          />
          <Card>
            <CardHeader>
              <CardTitle>Quality Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We source only the finest ingredients to ensure every pancake meets our high standards of excellence.</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <img 
            src="/pancake3.jpg" 
            alt="Our Team" 
            className="rounded-lg shadow-lg w-full h-[250px] object-cover mb-4"
          />
          <Card>
            <CardHeader>
              <CardTitle>Expert Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Our skilled team works tirelessly to create the perfect pancake experience for every customer.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default About
