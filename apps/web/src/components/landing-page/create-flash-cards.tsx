import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, ImageIcon, File } from "lucide-react";

export function CreateFlashCards() {
  return (
    <section id="create-now" className="space-y-8">
      <Card className="max-w-3xl mx-auto border-primary shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Create Flash Cards</CardTitle>
          <CardDescription>Upload text, images, or files to create flash cards instantly</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 w-full">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2 relative group">
                  <Upload className="h-4 w-4" />
                  Upload
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Coming soon!
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <Textarea placeholder="Enter your text here..." className="min-h-[150px]" />
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 transition-colors min-h-[150px] flex flex-col items-center justify-center text-center border-muted-foreground/20 relative">
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <p className="text-muted-foreground mb-2">File upload feature coming soon!</p>
                    <p className="text-sm text-muted-foreground">
                      This feature is not available in the current version.
                    </p>
                  </div>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">Drag and drop files here</p>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <Button variant="outline" disabled>
                      <File className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <CardFooter className="border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
              <Button size="lg" className="w-full py-6 text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Flash me!
              </Button>
            </CardFooter>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
