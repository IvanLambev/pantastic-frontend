import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"

const About = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl pb-32">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12">
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">About Pantastic</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Delivering the luxury of choice, daily. At Pantastic, we've revolutionized the art of pancake making,
            bringing you a perfect blend of traditional flavors and modern innovation.
          </p>
        </div>
        <div className="flex-1">
          <img 
            src="/pancake1.jpg" 
            alt="Delicious Pantastic Pancakes" 
            className="rounded-lg shadow-lg w-full h-[200px] md:h-[300px] object-cover"
          />
        </div>
      </div>

      {/* Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>Making joy accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm md:text-base">To bring delicious, high-quality pancakes to everyone, making every day a little more special with our unique flavors and combinations.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
            <CardDescription>Leading innovation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm md:text-base">To revolutionize the pancake industry through innovative recipes, sustainable practices, and exceptional customer service.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
            <CardDescription>Quality & Care</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm md:text-base">We believe in using premium ingredients, maintaining the highest quality standards, and treating every customer like family.</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Our Journey</CardTitle>
          <CardDescription>From a simple idea to a pancake revolution</CardDescription>
        </CardHeader>
        <CardContent>
          <Timeline>
            <TimelineItem year="2020" title="The Beginning">
              Started as a small local pancake shop with a vision to revolutionize breakfast.
            </TimelineItem>
            <TimelineItem year="2021" title="Expansion">
              Opened three new locations and introduced our signature recipes.
            </TimelineItem>
            <TimelineItem year="2022" title="Sustainability">
              Launched our eco-friendly packaging and sustainable sourcing program.
            </TimelineItem>
            <TimelineItem year="2023" title="Digital Transformation">
              Introduced our new mobile app and rewards program to enhance customer experience.
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img 
            src="/pancake2.jpg" 
            alt="Our Kitchen" 
            className="rounded-lg shadow-lg w-full h-[200px] md:h-[250px] object-cover mb-4"
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Quality Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base">We source only the finest ingredients to ensure every pancake meets our high standards of excellence.</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <img 
            src="/pancake3.jpg" 
            alt="Our Team" 
            className="rounded-lg shadow-lg w-full h-[200px] md:h-[250px] object-cover mb-4"
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Expert Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base">Our skilled chefs and dedicated staff work together to create the perfect dining experience.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default About