👨‍👩‍👧‍👦 Family Tree Component
An interactive Angular component to render, manage, and edit a hierarchical family tree using drag-and-drop functionality and zoomable SVG connections. This component supports dynamic updates, touch gestures, zooming, saving, and node editing.

📦 Features
🖱️ Drag-and-drop positioning for family members.

✍️ Edit Panel: Rename, add children, or remove members.

🔍 Zoom Controls: Smooth zoom in/out with automatic centering.

📱 Mobile support: Double-tap to select members on touch devices.

🔗 SVG Lines: Automatically connects parents to children.

💾 Save Functionality: Save the updated family tree.

🛠️ Technologies Used
Angular (standalone component)

HTML + CSS

TypeScript

Angular Animations

Two-way data binding (FormsModule)

Font: Amiri (for Arabic/Urdu-style names)

📁 File Structure
rust
Copy
Edit
tree.component.ts       → Main logic and interactivity
tree.component.html     → Template layout for tree structure
tree.component.css      → Styling for member cards, edit panel, and zoom controls
🧠 Component Overview
📌 TreeComponent
Selector: app-tree

Standalone: ✅

Inputs: None

Dependencies: CommonModule, FormsModule

🧩 Core Concepts
🧱 Tree Structure
The family tree is made up of FamilyMember objects:

ts
Copy
Edit
interface FamilyMember {
  id: number;
  name: string;
  x: number;
  y: number;
  children: FamilyMember[];
}
✨ Member Cards
Displayed as circular cards.

Positioned absolutely based on x and y.

Double-click (or double-tap on touch devices) opens an edit panel.

⚙️ Edit Panel
When a member is selected:

You can edit the name.

Add a child to the member.

Delete the member.

View and select children in a dropdown list.

➕ Zoom Functionality
Buttons + and – allow zooming in/out.

Initial zoom level is auto-fit to screen.

Content scrolls to center automatically.

🔄 Drag & Drop
Members can be dragged using mouse or touch.

Position updates are stored in the tree structure.

💾 Save Function
Calls TreeService.saveTree() and displays a success/failure message.

✅ How to Use
1. Load Data
Ensure TreeService.loadTree() returns a FamilyMember[] to initialize the tree.

2. Save Tree
Hook TreeService.saveTree() to persist the updated tree.

📸 UI Preview (Text-Based)
sql
Copy
Edit
+-------------------------+
|        Zoom (+/-)      |
+-------------------------+

[ Parent ]
    |
[ Child 1 ]     [ Child 2 ]

↳ Edit member
↳ Add child
↳ Remove member
↳ Rename member
🧪 Interactions
Interaction	Behavior
Drag node	Moves member in tree
Double-click/tap	Opens edit panel for the member
Zoom in/out buttons	Adjusts tree scaling
Save button	Persists tree to backend

💡 Customization
🎨 Modify tree.component.css to change themes or shapes.

🔧 Update TreeService for API integration.

🌐 Add internationalization for UI text if needed.

⚠️ Notes
Ensure all members have unique ids.

All coordinates (x, y) are relative to the tree container.

SVG lines assume each node is 100x100 and centered accordingly.

📂 Dependencies
ts
Copy
Edit
@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ]
})
Optional: Add BrowserAnimationsModule if not already included globally.

📬 Support
For bugs, improvements, or suggestions, feel free to reach out or open an issue in your repo.

