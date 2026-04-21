export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-white">
                <img src="/LGU_logo.png" alt="LGU Logo" className="h-8 w-8 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Employee & Supplier</span>
                <span>Expense System</span>
            </div>
        </>
    );
}
