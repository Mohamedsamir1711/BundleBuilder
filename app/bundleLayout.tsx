"use client";

import { useState, MouseEvent, useEffect } from "react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  originalPrice?: number;
  price: number;
  availableColors?: string[];
  initialColor?: string;
  initialQuantity: number;
  imageUrl: string;
  isMonthly?: boolean;
  isFree?: boolean;
}

interface Step {
  stepNumber: number;
  categoryId: string;
  title: string;
  products: Product[];
}

const buildInitialCartState = (steps: Step[]) => {
  const state: Record<
    string,
    { quantity: number; selectedColor: string | null }
  > = {};
  steps.forEach((step) => {
    step.products.forEach((p) => {
      state[p.id] = {
        quantity: p.initialQuantity,
        selectedColor: p.initialColor || (p.availableColors?.[0] ?? null),
      };
    });
  });
  return state;
};

export default function BundleLayout({
  initialData,
}: {
  initialData: { steps: Step[] };
}) {
  const steps = initialData.steps;

  const [cartState, setCartState] = useState(() =>
    buildInitialCartState(steps),
  );
  const [isInitialized, setIsInitialized] = useState(false);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("bundleCartState");
      if (saved) {
        try {
          setCartState(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved cart state", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);


  useEffect(() => {
    if (isInitialized) {
      window.localStorage.setItem("bundleCartState", JSON.stringify(cartState));
    }
  }, [cartState, isInitialized]);


  const [openSteps, setOpenSteps] = useState<number[]>([1]);

  const updateQuantity = (id: string, delta: number) => {
    setCartState((prev) => {
      const currentQty = prev[id]?.quantity ?? 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [id]: { ...prev[id], quantity: newQty } };
    });

  };


  const updateColor = (id: string, color: string) => {
    setCartState((prev) => ({
      ...prev,
      [id]: { ...prev[id], selectedColor: color },
    }));

  };

  
  const allProducts = steps.flatMap((s) => s.products);
  const selectedItems = allProducts.filter(
    (p) => (cartState[p.id]?.quantity ?? 0) > 0,
  );

  let totalCurrentPrice = 0;
  let totalOriginalPrice = 0;
  let monthlyPriceString = "0.00";

  selectedItems.forEach((item) => {
    const qty = cartState[item.id].quantity;
    if (item.isMonthly) {
      monthlyPriceString = item.price.toFixed(2);
    } else {
      totalCurrentPrice += item.price * qty;
      totalOriginalPrice += (item.originalPrice ?? item.price) * qty;
    }
  });

  const overallSavings = totalOriginalPrice - totalCurrentPrice;

  return (
    <div className='grid grid-cols-1 md:grid-cols-[5fr_3fr] xl:grid-cols-1 gap-4 md:gap-3 max-w-[1400px] mx-auto w-full'>
      <div className='min-w-0'>
        {steps.map((step) => {
          const selectedInStepCount = step.products.filter(
            (p) => (cartState[p.id]?.quantity ?? 0) > 0,
          ).length;

          return (
            <div
              key={step.stepNumber}
              className={`font-sans rounded border m-4 md:m-4 md:mx-4 xl:m-6 xl:mx-9 p-3 transition-colors ${step.stepNumber === 1
                ? "border-gray-200 bg-[#dde9fd]"
                : "border-gray-200 bg-[#ffffff] hover:bg-[#dde9fd]"
                }`}
            >
              <span className='text-gray-500 text-sm'>
                STEP {step.stepNumber} OF 4
              </span>
              <hr className='text-gray-400 pt-3' />
              <details
                id={`step-details-${step.stepNumber}`}
                open={openSteps.includes(step.stepNumber)}
                onToggle={(e) => {
                  const isOpen = (e.target as HTMLDetailsElement).open;
                  setOpenSteps((prev) => {
                    const isCurrentlyOpen = prev.includes(step.stepNumber);
                    if (isOpen && !isCurrentlyOpen) return [...prev, step.stepNumber];
                    if (!isOpen && isCurrentlyOpen) return prev.filter((s) => s !== step.stepNumber);
                    return prev;
                  });
                }}
                className='group'
              >
                <summary className='flex items-center justify-between cursor-pointer list-none'>
                  <h2 className='text-xl font-bold text-slate-900'>
                    {step.title}
                  </h2>
                  <div className='flex items-center gap-1 text-sm text-indigo-600 font-medium'>
                    <span>{selectedInStepCount} selected</span>
                    <span>
                      <svg
                        className='h-4 w-4 transition-transform duration-300 group-open:-rotate-90'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke-width='2'
                        stroke='currentColor'
                      >
                        <path
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          d='M19.5 8.25l-7.5 7.5-7.5-7.5'
                        />
                      </svg>
                    </span>
                  </div>
                </summary>

                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 xl:gap-3 mt-4 p-3 md:p-4 xl:p-4'>
                  {step.products.map((product, productIndex) => {
                    const currentQty = cartState[product.id]?.quantity ?? 0;
                    const hasItemsSelected = currentQty > 0;
                    const isLastOddProduct =
                      step.products.length % 2 !== 0 &&
                      productIndex === step.products.length - 1;

                    return (
                      <div
                        key={product.id}
                        className={`h-full ${isLastOddProduct
                          ? "md:col-span-2 xl:col-span-1 flex justify-center md:px-[20%] xl:px-0"
                          : ""
                          }`}
                      >
                        <div
                          className={`relative bg-white rounded-xl border p-4 flex flex-col gap-3 transition-all w-full h-full ${hasItemsSelected
                            ? "border-indigo-600 ring-1 ring-indigo-600"
                            : "border-gray-200"
                            }`}
                        >
                          {product.badge && (
                            <span className='absolute -top-2.5 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm'>
                              {product.badge}
                            </span>
                          )}
                          <div className='shrink-0 flex items-center justify-center w-full h-28'>
                            <Image
                              src={product.imageUrl}
                              width={90}
                              height={90}
                              alt={product.name}
                              className='object-contain'
                            />
                          </div>

                          <div className='flex flex-col justify-between flex-1 min-w-0'>
                            <div>
                              <h3 className='text-sm font-bold text-gray-900'>
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className='text-xs text-gray-500 mt-0.5 leading-snug'>
                                  {product.description}
                                </p>
                              )}

                              {product.availableColors && (
                                <div className='flex items-center gap-2 mt-2 flex-wrap'>
                                  {product.availableColors.map((color) => (
                                    <label
                                      key={color}
                                      className='flex items-center gap-0.5 cursor-pointer'
                                    >
                                      <input
                                        type='radio'
                                        name={`color-${product.id}`}
                                        checked={
                                          cartState[product.id]?.selectedColor ===
                                          color
                                        }
                                        onChange={() =>
                                          updateColor(product.id, color)
                                        }
                                        className='sr-only'
                                      />
                                      <span
                                        className={`w-3.5 h-3.5 rounded-full inline-block border ${color === "White"
                                          ? "bg-white"
                                          : color === "Grey"
                                            ? "bg-gray-400"
                                            : "bg-gray-900"
                                          } ${cartState[product.id]?.selectedColor === color ? "ring-2 ring-indigo-500 ring-offset-1" : ""}`}
                                      />
                                      <span className='text-[10px] text-gray-600'>
                                        {color}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className='flex items-center justify-between mt-4 gap-2'>
                              <div className='flex items-center gap-1.5'>
                                <button
                                  onClick={() => updateQuantity(product.id, -1)}
                                  className='w-6 h-6 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100'
                                >
                                  −
                                </button>
                                <span className='text-sm font-semibold text-gray-900 w-3 text-center'>
                                  {currentQty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(product.id, 1)}
                                  className='w-6 h-6 rounded-full border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-100'
                                >
                                  +
                                </button>
                              </div>
                              <div className='text-right grid grid-cols-1 shrink-0'>
                                {product.originalPrice && (
                                  <span className='text-xs text-red-600 line-through'>
                                    ${product.originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className='text-sm font-bold text-gray-900'>
                                  {product.isFree
                                    ? "FREE"
                                    : `$${product.price.toFixed(2)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {step.stepNumber < steps.length && (
                    <div className='col-span-1 md:col-span-2 xl:col-span-5 flex justify-center mt-2 mb-1'>
                      <button
                        type='button'
                        onClick={() => {
                          const nextStep = step.stepNumber + 1;
                          setOpenSteps((prev) => {
                            if (!prev.includes(nextStep)) {
                              return [...prev, nextStep];
                            }
                            return prev;
                          });
                          setTimeout(() => {
                            const el = document.getElementById(`step-details-${nextStep}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className='px-10 py-2 rounded-md border border-indigo-600 text-indigo-600 font-semibold bg-transparent hover:bg-indigo-50 transition-colors'
                      >
                        Next: {steps[step.stepNumber]?.title}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <aside className='font-sans rounded border border-gray-200 bg-[#dde9fd] m-4 md:m-0 md:mr-3 md:mt-4 xl:m-6 xl:mx-9 p-3 md:p-3 xl:p-6 h-fit md:sticky md:top-4 xl:static overflow-hidden'>
        <div className='flex flex-col gap-4 xl:grid xl:grid-cols-[5fr_3fr] xl:gap-8 xl:items-start'>
          <div className='min-w-0 space-y-4'>
            <div>
              <span className='text-gray-500 text-sm'>REVIEW</span>
              <h2 className='text-black font-bold text-xl mt-1'>
                Your Security System
              </h2>
              <p className='text-gray-500 text-sm'>
                Review your personalized protection system designed to keep what
                matters most safe.
              </p>
              <hr className='text-gray-400 mt-3' />
            </div>

            {steps.map((step) => {
              const activeStepProducts = step.products.filter(
                (p) => (cartState[p.id]?.quantity ?? 0) > 0,
              );
              if (activeStepProducts.length === 0) return null;

              return (
                <div key={`review-${step.categoryId}`} className='pt-2'>
                  <p className='text-xs text-gray-400 font-semibold tracking-wider mb-2 uppercase'>
                    {step.categoryId}
                  </p>
                  <div className='space-y-3'>
                    {activeStepProducts.map((item) => {
                      const qty = cartState[item.id].quantity;
                      return (
                        <div
                          key={`review-card-${item.id}`}
                          className='flex items-center gap-3 py-2'
                        >
                          <div className='shrink-0 w-10 h-10 flex items-center justify-center'>
                            <Image
                              src={item.imageUrl}
                              width={40}
                              height={40}
                              alt={item.name}
                              className='object-contain'
                            />
                          </div>
                          <div className='flex-1 min-w-0 flex items-center justify-between gap-2'>
                            <h4 className='text-sm font-bold text-gray-900 truncate flex-1'>
                              {item.name}
                              {cartState[item.id]?.selectedColor
                                ? ` (${cartState[item.id].selectedColor})`
                                : ""}
                            </h4>

                            <div className='flex items-center gap-2 md:gap-1.5 shrink-0'>
                              <div className='flex items-center gap-2.5'>
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className='w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 font-medium text-lg transition-colors'
                                >
                                  −
                                </button>
                                <span className='text-sm font-semibold text-gray-900 w-4 text-center'>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className='w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 font-medium text-lg transition-colors'
                                >
                                  +
                                </button>
                              </div>
                              <div className='flex flex-col xl:flex-row xl:items-center xl:gap-2 items-end min-w-[50px] md:min-w-[50px] xl:min-w-[90px] xl:justify-end'>
                                {item.originalPrice && (
                                  <span className='text-xs xl:text-sm text-gray-500 line-through leading-none xl:leading-normal mb-0.5 xl:mb-0'>
                                    ${(item.originalPrice * qty).toFixed(2)}
                                  </span>
                                )}
                                <span className='text-base font-bold text-indigo-600 leading-none xl:leading-normal'>
                                  {item.isFree
                                    ? "FREE"
                                    : `$${(item.price * qty).toFixed(2)}${item.isMonthly ? "/mo" : ""}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <hr className='text-gray-300 mt-4' />
                </div>
              );
            })}
          </div>

          <div className='flex flex-col justify-center gap-4 pt-4 border-t border-gray-300 xl:border-t-0 xl:pt-0'>
            <div className='hidden xl:flex items-start gap-4'>
              <div className='shrink-0'>
                <Image
                  src='/images/wyze.png'
                  width={100}
                  height={100}
                  alt='Satisfaction guarantee'
                  className='object-contain'
                />
              </div>
              <div className='min-w-0'>
                <h3 className='text-sm font-bold text-gray-900 leading-snug'>
                  30-day hassle-free returns
                </h3>
                <p className='text-xs text-gray-700 mt-1 leading-snug'>
                  If you&apos;re not totally in love with the product, we will
                  refund you 100%.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-between xl:flex-col xl:items-stretch xl:gap-2'>
              <div className='shrink-0 xl:hidden'>
                <Image
                  src='/images/wyze.png'
                  width={100}
                  height={100}
                  alt='Satisfaction guarantee'
                  className='object-contain md:w-24 md:h-24'
                />
              </div>

              <div className='flex flex-col items-end xl:flex-row xl:items-center xl:justify-between gap-1 xl:gap-2 w-full'>
                <h4 className='text-[11px] md:text-xs bg-indigo-600 rounded-full px-3 py-0.5 text-white whitespace-nowrap font-medium'>
                  as low as ${monthlyPriceString}/mo
                </h4>
                <div className='flex items-center justify-end gap-2 mt-1'>
                  <span className='text-sm md:text-base text-gray-500 line-through'>
                    ${totalOriginalPrice.toFixed(2)}
                  </span>
                  <span className='text-xl md:text-2xl font-bold text-indigo-600'>
                    ${totalCurrentPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {overallSavings > 0 && (
              <div className='text-[#00a82a] text-[11px] md:text-[13px] font-semibold text-center'>
                Congrats! You&apos;re saving ${overallSavings.toFixed(2)} on
                your security bundle!
              </div>
            )}

            <button className='p-3 md:p-4 w-full bg-indigo-600 rounded-md font-bold text-white text-sm md:text-base shadow-sm hover:bg-indigo-700 transition-colors'>
              Checkout
            </button>
            <a
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                window.localStorage.setItem("bundleCartState", JSON.stringify(cartState));
                alert("Your system has been saved for later!");
                setCartState(buildInitialCartState(steps));
                window.location.reload();

              }}
              className='text-center text-gray-500 text-[11px] md:text-xs underline italic hover:text-gray-700 cursor-pointer'
            >
              Save my system for later
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
