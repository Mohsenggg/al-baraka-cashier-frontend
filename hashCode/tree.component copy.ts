

// import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// // import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { animate, state, style, transition, trigger } from '@angular/animations';
// import { FamilyMember } from '../../model/interface/FamilyMember';
// import { TreeService } from '../../srevices/tree.service';

// @Component({
//      selector: 'app-tree',
//      standalone: true,
//      imports: [CommonModule, FormsModule],
//      templateUrl: './tree.component.html',
//      styleUrl: './tree.component.css',
//      animations: [
//           trigger('fadeInOut', [
//                state('in', style({ opacity: 1, transform: 'scale(1)' })),
//                transition(':enter', [
//                     style({ opacity: 0, transform: 'scale(0.95)' }),
//                     animate('300ms ease-out'),
//                ]),
//                transition(':leave', [
//                     animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
//                ]),
//           ]),
//      ],

// })

// export class TreeComponent implements OnInit {


//   @ViewChild('treeContainer', { static: false }) treeContainerRef!: ElementRef;

//      familyTree: FamilyMember[] = [];
//      draggingMember: FamilyMember | null = null;
//      selectedMember: FamilyMember | null = null;

//      offsetX = 0;
//      offsetY = 0;

//      newName: string = '';
//      childName: string = '';

//     //  scale = 1;
//     //  translateX = 0;
//     //  translateY = 0;

//     //  private isPanning = false;
//     //  private startX = 0;
//     //  private startY = 0;

//     //  private initialDistance = 0;
//     //  private initialScale = 1;  // <-- Match the starting scale
//     //  transformStyle = 'translate(0px, 0px) scale(1)';


//      //============================||  Initialize ||============================

//      constructor(
//           private cdr: ChangeDetectorRef,
//           private treeService: TreeService
//      ) { }


//      ngOnInit() {

//         // this.familyTree = [
//             //      { id: 1, name: 'Grandparent', children: [], x: 300, y: 50 }
//             // ];

//       this.treeService.loadTree().then((tree) => {
//         this.familyTree = tree;

//         // Wait until next frame after DOM updates
//       //   requestAnimationFrame(() => {
//       //     this.centerTree();
//       //   });
//       });
//     }



//      saveMessage = '';


//      onSave() {
//           this.treeService.saveTree(this.familyTree)
//                .then(() => {
//                     this.saveMessage = '✅ Tree saved successfully!';
//                     alert("✅ Tree saved successfully!")
//                     setTimeout(() => this.saveMessage = '', 3000); // Hide after 3 sec
//                })
//                .catch(error => {
//                     console.error('Error saving tree:', error);
//                     this.saveMessage = '❌ Failed to save tree.';
//                });
//      }


//      //=======================================================================
//      //============================||  Dynamics ||============================
//      //=======================================================================

//      // ----------------- Drag & Drop ----------------------

//      startDrag(event: MouseEvent | TouchEvent, member: FamilyMember): void {

//           const isTouch = event instanceof TouchEvent;
//           const clientX = isTouch ? event.touches[0].clientX : (event as MouseEvent).clientX;
//           const clientY = isTouch ? event.touches[0].clientY : (event as MouseEvent).clientY;

//           this.offsetX = clientX - member.x;
//           this.offsetY = clientY - member.y;
//           this.draggingMember = member;

//           if (isTouch) {
//                event.preventDefault(); // Prevent scrolling during touch drag
//           }
//      }

//      @HostListener('document:mousemove', ['$event'])
//      @HostListener('document:touchmove', ['$event'])
//      onMouseMove(event: MouseEvent | TouchEvent): void {
//           if (this.draggingMember) {
//                this.treeService.moveMember(this.draggingMember, event, this.offsetX, this.offsetY);
//                this.cdr.detectChanges();
//           }
//      }

//      @HostListener('document:mouseup')
//      @HostListener('document:touchend')
//      stopDrag(): void {
//           this.draggingMember = null;
//      }

//      // ----------------- selection ----------------------

//      @HostListener('document:dblclick', ['$event'])
//      onDoubleClick(event: MouseEvent): void {
//           const target = event.target as HTMLElement;
//           const memberCard = target.closest('.member-card');
//           if (memberCard) {
//                const memberId = Number(memberCard.getAttribute('data-id'));
//                const member = this.treeService.findMemberById(this.familyTree, memberId);
//                if (member) {
//                     this.assignSelectedMember(member);
//                }
//           }
//      }

//      @HostListener('document:click', ['$event'])
//      onSingleClick(event: MouseEvent): void {
//           const target = event.target as HTMLElement;
//           const isClickOutside = !target.closest('.edit-panel') && !target.closest('.member-card');
//           if (isClickOutside) {
//                this.selectedMember = null;
//           }
//      }

//      assignSelectedMember(member: FamilyMember): void {
//           this.selectedMember = member;
//           this.newName = member.name;
//      }

//      // ----------------- ZOOM & Scroll ----------------------

// // startPan(event: MouseEvent | TouchEvent): void {
// //   this.isPanning = true;

// //   const point = event instanceof TouchEvent ? event.touches[0] : event;
// //   this.startX = point.clientX - this.translateX;
// //   this.startY = point.clientY - this.translateY;

// //   if (event instanceof TouchEvent && event.touches.length === 2) {
// //     this.initialDistance = this.getDistance(event.touches[0], event.touches[1]);
// //     this.initialScale = this.scale;  // ✅ use current scale as starting point
// //   }
// // }

// // onPan(event: MouseEvent | TouchEvent): void {
// //   if (!this.isPanning) return;

// //   if (event instanceof TouchEvent) {
// //     if (event.touches.length === 1) {
// //       const touch = event.touches[0];
// //       this.translateX = touch.clientX - this.startX;
// //       this.translateY = touch.clientY - this.startY;
// //     } else if (event.touches.length === 2) {
// //       const newDistance = this.getDistance(event.touches[0], event.touches[1]);
// //       const scaleRatio = newDistance / this.initialDistance;
// //       this.scale = this.initialScale * scaleRatio;

// //       // ✅ Clamp scale (allows zoom out & in)
// //       const minScale = 0.2;
// //       const maxScale = 3;
// //       this.scale = Math.max(minScale, Math.min(this.scale, maxScale));
// //     }
// //   } else {
// //     this.translateX = event.clientX - this.startX;
// //     this.translateY = event.clientY - this.startY;
// //   }

// //   this.updateTransform();
// // }

// // endPan(): void {
// //   this.isPanning = false;
// // }

// // updateTransform(): void {
// //   this.transformStyle = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
// // }

// private getDistance(touch1: Touch, touch2: Touch): number {
//   const dx = touch2.clientX - touch1.clientX;
//   const dy = touch2.clientY - touch1.clientY;
//   return Math.sqrt(dx * dx + dy * dy);
// }

// // ---------------- using mouse

// // @HostListener('wheel', ['$event'])
// // onWheel(event: WheelEvent): void {
// //   event.preventDefault();

// //   const zoomIntensity = 0.1;
// //   const direction = event.deltaY > 0 ? -1 : 1;
// //   const newScale = this.scale + direction * zoomIntensity;

// //   // Limit zoom scale between 0.5x and 2x (you can adjust these)
// //   this.scale = Math.min(Math.max(newScale, 0.5), 2);

// //   // Optional: Zoom relative to mouse position for better UX
// //   const rect = (event.target as HTMLElement).getBoundingClientRect();
// //   const offsetX = event.clientX - rect.left;
// //   const offsetY = event.clientY - rect.top;

// //   this.translateX -= offsetX * zoomIntensity * direction;
// //   this.translateY -= offsetY * zoomIntensity * direction;

// //   this.updateTransform();
// // }

//      //=======================================================================
//      //============================||  Features ||============================
//      //=======================================================================

//      // -------------------------- Update & Manage ---------------------------

//      updateName(): void {
//           if (this.selectedMember) {
//                this.treeService.updateMemberName(this.selectedMember, this.newName.trim());
//           }
//      }

//      addNewChild(): void {
//           if (this.selectedMember && this.childName.trim()) {
//                this.treeService.addChild(this.selectedMember, this.childName.trim());
//                this.childName = '';
//           }
//      }

//      removeSelectedChild(): void {
//           if (this.selectedMember) {
//                const success = this.treeService.removeMemberFromTree(this.familyTree, this.selectedMember.id);
//                if (success) {
//                     this.selectedMember = null;
//                     this.cdr.detectChanges();
//                }
//           }
//      }

// }


